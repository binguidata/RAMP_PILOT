
import pandas as pd
import networkx as nx
import osmnx as ox
import math
import copy
from Rider_Rev9 import *


# Returns nearest node in graph
def getNearestNode(G, coords):
    nearestNode = ox.distance.nearest_nodes(G, coords[1], coords[0])
    return nearestNode

# Find the closest node for the specific transit hub stop
def getHubNodes(G, data):
    hubNodes = []
    for i in range(len(data)):
        hubNode = getNearestNode(G, (data['lat'].iloc[i], data['lng'].iloc[i]))
        hubNodes.append(hubNode)
    data['nodes'] = hubNodes
    return data

# Format riders into 'rider objects' for simulation
def formatRiderData(G, riderData):
    # Convert all times to seconds
    riderData['requestTime'] = pd.to_datetime(riderData['Promised Pick-up Time.1'])
    riderData['requestTime(sec)'] = riderData['requestTime'].dt.hour*3600 + \
                                    riderData['requestTime'].dt.minute*60 + \
                                    riderData['requestTime'].dt.second
    riderList = []
    for i in range(len(riderData)):
        orig = getNearestNode(G, (riderData['Pick-Up Latitude'].iloc[i], riderData['Pick-Up Longitude'].iloc[i]))
        dest = getNearestNode(G, (riderData['Drop-off Latitude'].iloc[i], riderData['Drop-off Longitude'].iloc[i]))
        riderList.append(rider(i, riderData['Customer Number'].iloc[i], \
                               orig, dest, riderData['requestTime(sec)'].iloc[i]))
    return riderList


def createFixedRoute(G, fixedRoute, hubInfo, startTime, endTime, routeID, dwell):
    stops, arrTime, deptTime, stopNode = [],[],[],[]
    t = startTime
    while (t < endTime):
        stops.append(fixedRoute[0])
        arrTime.append(t)
        t += dwell
        deptTime.append(t)
        origNode = hubInfo[hubInfo['name'] == fixedRoute[0]]['nodes'].iloc[0]
        destNode = hubInfo[hubInfo['name'] == fixedRoute[1]]['nodes'].iloc[0]
        stopNode.append(origNode) 
        pathTime = nx.shortest_path_length(G, source=origNode, target=destNode, weight='travel_time')
        arrivalTime = math.ceil(pathTime/60)*60 + t
        t = arrivalTime
        fixedRoute = fixedRoute[1:] + [fixedRoute[0]]  
    d = {'Stop_id':stops, 'arrTime':arrTime, 'deptTime':deptTime, 'stopNode':stopNode}
    df = pd.DataFrame(data=d)
    df['routeID'] = routeID
    return df

def createFixedRouteTimeTable(G, fixedRoutes, shiftTime, routeIDs, dwell, hubInfo):
    for i in range(len(fixedRoutes)):
        if (i == 0):
            busSched = createFixedRoute(G, fixedRoutes[i], hubInfo, shiftTime[i][0], shiftTime[i][1], routeIDs[i], dwell)
        else:
            busSched1 = createFixedRoute(G, fixedRoutes[i], hubInfo, shiftTime[i][0], shiftTime[i][1], routeIDs[i], dwell)
            busSched = pd.concat([busSched, busSched1], axis=0).sort_values(by='deptTime').reset_index(drop=True)
    return busSched


# The a list of unique POIs for OD matrix computation
def getUniquePOIs(riderList, startNodes, FR_stops):
    pois = copy.copy(startNodes + FR_stops)
    for rider in riderList:
        if (rider.orig not in pois):
            pois.append(rider.orig)
        if (rider.dest not in pois):
            pois.append(rider.dest)
    return pois

# Precompute OD travel times
def getODMatrix(G, pois):
    odDict = dict()
    for i in range(len(pois)):
        for j in range(len(pois)):
            if (nx.has_path(G, source=pois[i], target=pois[j])):
                pathTime = nx.shortest_path_length(G, source=pois[i], target=pois[j], weight='travel_time')
                odDict[str(pois[i]) + ',' + str(pois[j])] = pathTime
    return odDict