from reservation.Rider_Rev10 import *
from reservation.Create_FR_Graph import *
import requests
import json

from . import reservation_config


busSched = pd.read_csv(reservation_config.bus_sched_path)
G1 = create_FR_graph(busSched)

with open(reservation_config.OD_dist_mat_path, 'r') as fp:
    OD_dist_mat = json.load(fp)

with open(reservation_config.OD_time_mat_path, 'r') as fp:
    OD_time_mat = json.load(fp)

def get_travel_time_api(orig_lati, orig_long, dest_lati, dest_long):
    url = "https://graphhopper.com/api/1/route"
    query = {
        "key": "39835c21-f050-42c7-b99b-25db2a9dfc95"
    }
    payload = {
        "points": [
            [
                orig_long,
                orig_lati
            ],
            [
                dest_long,
                dest_lati
            ]
        ],
        "instructions": False,
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, params=query)
    data = response.json()
    if 'paths' in data:
        return data['paths'][0]['time'] / 1000
    else:
        return 0

def nearest_node_return(lat, lng):
    lat = float(lat)
    lng = float(lng)

    # read POI csv file
    df_nodes = pd.read_csv(reservation_config.nodes_path)

    # calculate the distance^2 between the POI and the given (lat, lng)
    df_nodes['dist2'] = pow(df_nodes['node_latitude'] - lat, 2) + pow(df_nodes['node_longitude'] - lng, 2)

    # find the id of the minimum value in dist2
    id1 = df_nodes[['dist2']].idxmin(axis=0, skipna=True)
    node1 = df_nodes.loc[id1, 'node'].iloc[0]

    return node1

def nearest_node(lat, lng):
    lat = float(lat)
    lng = float(lng)
    df_nodes = pd.read_csv(reservation_config.nodes_path)

    df_nodes['dist2'] = pow(df_nodes['node_latitude'] - lat, 2) + pow(df_nodes['node_longitude'] - lng, 2)

    id1 = df_nodes[['dist2']].idxmin(axis=0, skipna=True)
    node1 = df_nodes.loc[id1, 'node'].values[0]
    node1_lat = df_nodes.loc[id1, 'node_latitude'].values[0]
    node1_lng = df_nodes.loc[id1, 'node_longitude'].values[0]

    travelTime1 = get_travel_time_api(lng, lat, node1_lng, node1_lat)

    # check if the POI candidate is really close to the given (lat, lng) or not
    if travelTime1 > 60:
        df_nodes = df_nodes.drop(df_nodes.index[df_nodes[['dist2']].idxmin(axis=0, skipna=True)]).reset_index(drop=True)
        id2 = df_nodes[['dist2']].idxmin(axis=0, skipna=True)
        node2 = df_nodes.loc[id2, 'node'].values[0]
        node2_lat = df_nodes.loc[id2, 'node_latitude'].values[0]
        node2_lng = df_nodes.loc[id2, 'node_longitude'].values[0]
        travelTime2 = get_travel_time_api(lng, lat, node2_lng, node2_lat)

        if travelTime2 < travelTime1 and travelTime2 != 0:
            return node2, travelTime2
        else:
            return node1, travelTime1

    else:
        return node1, travelTime1


def time_to_second(time_str):
    hour, minute, second = time_str.split(':')
    hour = int(hour)
    minute = int(minute)
    second = int(second)

    return hour * 60 * 60 + minute * 60 + second


def getDirectTravelTime(OD_time_mat, orig, dest):
    travTime = OD_time_mat[str(orig) + ',' + str(dest)]
    return travTime


# Get nearest stop to orig/dest for each potential bus route
def getNearestStops(OD_time_mat, location, busSched, dirTravTime, thresh):
    store = []
    for route in busSched['routeID'].unique():
        filt = busSched[busSched['routeID'] == route].copy()
        travTimes, busStops = [],[]
        for busStop in filt['stopNode'].unique():
            busStop = int(busStop)
            travTime = OD_time_mat[str(location) + ',' + str(busStop)]
            travTimes.append(travTime)
            busStops.append(busStop)
        bestIndex = travTimes.index(min(travTimes))
        bestBusStop = busStops[bestIndex]
        bestTravTime = travTimes[bestIndex]
        if bestTravTime < thresh*dirTravTime:
            store.append((route, bestBusStop))
    return store


# Get the best possible fixed route (not-time dependent)
def selectBestFixedRoute(G_FR, OD_time_mat, request, origStops, destStops):
    if (len(origStops) == 0) or (len(destStops) == 0):
        return 'No Feasible Path', None, None, None
    else:
        routes, travTimes = [],[]
        for o in origStops:
            for d in destStops:
                fr_o, fr_d = f'{o[1]}_{o[0]}', f'{d[1]}_{d[0]}'
                FM_time = OD_time_mat[str(request.orig) + ',' + str(o[1])]
                try:
                    FR_path = nx.shortest_path(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                    FR_time = nx.shortest_path_length(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                except:
                    break
                LM_time = OD_time_mat[str(d[1]) + ',' + str(request.dest)]
                travTime = FM_time + FR_time + LM_time
                routes.append(FR_path)
                travTimes.append(travTime)
        bestIndex = travTimes.index(min(travTimes))
        bestRoute = routes[bestIndex]
        bestTime = travTimes[bestIndex]
    return bestRoute, bestTime, FM_time, LM_time


# Assign FM and LM trips based on transit catchment area
def assignFMLM(distance, catchment):
    walk = 0
    shuttle = 1
    if distance < catchment:
        mode = walk
    else:
        mode = shuttle
    return mode


def FMLM_trips(G, request, FR_path, catchment, OD_dist_mat):
    FR_orig = FR_path[0].split('_')[0]
    FR_dest = FR_path[-1].split('_')[0]
    origDist = OD_dist_mat[str(request.orig) + ',' + str(FR_orig)] * 1760.0
    destDist = OD_dist_mat[str(FR_dest) + ',' + str(request.dest)] * 1760.0
    FM_mode = assignFMLM(origDist, catchment)
    LM_mode = assignFMLM(destDist, catchment)
    return FM_mode, LM_mode


def canTripBeServed(request, FM_mode, LM_mode):
    shuttle = 1
    if (FM_mode == shuttle) and (request.origService == False):
        return False
    elif (LM_mode == shuttle) and (request.destService == False):
        return False
    else:
        return True


# request can not be served by the fixed-route, only on-demand shuttles are the options
def canTripBeServedByShuttle(request):
    if (request.origService == False) or (request.destService == False):
        return False
    else:
        return True


# Dont assign travel time to FM and LM walk trips
def multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode):
    if (FM_mode == 0):
        FM_time = 0
    if (LM_mode == 0):
        LM_time = 0
    return FM_time + FR_time + LM_time


def getAccessEgress(G_FR, FR_path, currentTime, busSched):
    filt = busSched[busSched['arrTime'] >= currentTime].sort_values(by='arrTime').copy()
    filt['stopInfo'] = filt['stopNode'].astype(str) + '_' + filt['routeID']
    j=0
    for i in range(len(filt)):
        if (FR_path[0] == filt['stopInfo'].iloc[i]):
            if (j == 0):
                accessTime = filt['arrTime'].iloc[i]
                lastStop = FR_path[0]
                lastStopTime = filt['arrTime'].iloc[i]
                j = 1
            FR_path = FR_path[1:]
        if (len(FR_path) == 0):
            egressTime = filt['arrTime'].iloc[i]
            return accessTime, egressTime
        if (i == len(filt)-1) and (len(FR_path) > 0):
            return -1, -1


def getFixedRouteInfo(FR_path, currentTime, busSched, G_FR):
    return getAccessEgress(G_FR, FR_path, currentTime, busSched)


def assignTrip(G, G1, OD_time_mat, busSched, request):
    dirTravTime = getDirectTravelTime(OD_time_mat, request.orig, request.dest)

    thresh = 0.25
    origInfo = getNearestStops(OD_time_mat, request.orig, busSched, dirTravTime, thresh)
    destInfo = getNearestStops(OD_time_mat, request.dest, busSched, dirTravTime, thresh)

    FR_path, FR_time, FM_time, LM_time = selectBestFixedRoute(G1, OD_time_mat, request, origInfo, destInfo)

    if (FR_path != 'No Feasible Path'):

        catchment = 600
        FM_mode, LM_mode = FMLM_trips(G, request, FR_path, catchment, OD_dist_mat)

        answer = canTripBeServed(request, FM_mode, LM_mode)
        if (answer == False):
            return 'Reject Rider'

        totalTime = multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode)

        threshold = 3.0
        if (totalTime < threshold*dirTravTime) or (request.origService == False) or (request.destService == False):
            middleLeg = 2
            FR_pickup, FR_dropoff = getFixedRouteInfo(FR_path, request.reqTime, busSched, G1)
            request.mode = [FM_mode, middleLeg, LM_mode]
            request.orig_FR = int(FR_path[0].split('_')[0])
            request.dest_FR = int(FR_path[-1].split('_')[0])
            request.FR_deptTime = FR_pickup
            request.FR_arrTime = FR_dropoff
            request.fixedRoute = FR_path

            if (request.FR_deptTime-request.reqTime) > (dirTravTime*threshold):
                request.mode = [1, 1, 1]

            if FR_pickup == -1:
                request.mode = [1, 1, 1]
        else:
            request.mode = [1, 1, 1]
    else:
        answer = canTripBeServedByShuttle(request)
        if (answer == False):
            return 'Reject Rider'
        else:
            request.mode = [1, 1, 1]
    return 'Accept Rider'
