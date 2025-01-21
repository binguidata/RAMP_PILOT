import networkx as nx
import pandas as pd


# Get the direct travel time using shortest path between origin and destination
def getDirectTravelTime(OD_mat, orig, dest):
    travTime = OD_mat[str(orig) + ',' + str(dest)]
    return travTime

def getDirectTravelDist(OD_dist_mat, orig, dest):
    travDist = OD_dist_mat[str(orig) + ',' + str(dest)]
    return travDist

# Get nearest stop to orig/dest for each potential bus route
def getNearestStops(OD_mat, location, busSched, dirTravTime, thresh):
    store = []
    for route in busSched['routeID'].unique():
        filt = busSched[busSched['routeID'] == route].copy()
        travTimes, busStops = [],[]
        for busStop in filt['stopNode'].unique():
            busStop = int(busStop)
            travTime = OD_mat[str(location) + ',' + str(busStop)]
            travTimes.append(travTime)
            busStops.append(busStop)
        bestIndex = travTimes.index(min(travTimes))
        bestBusStop = busStops[bestIndex]
        bestTravTime = travTimes[bestIndex]
        if (bestTravTime < thresh*dirTravTime):
            store.append((route, bestBusStop))
    return store
        
# Get the best possible fixed route (not-time dependent)
def selectBestFixedRoute(G_FR, OD_mat, request, origStops, destStops):
    if (len(origStops) == 0) or (len(destStops) == 0):
        return 'No Feasible Path', None, None, None
    else:
        routes, travTimes = [],[]
        for o in origStops:
            for d in destStops:
                fr_o, fr_d = f'{o[1]}_{o[0]}', f'{d[1]}_{d[0]}'
                FM_time = OD_mat[str(request.orig) + ',' + str(o[1])]
                try:
                    FR_path = nx.shortest_path(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                    FR_time = nx.shortest_path_length(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                except:
                    break
                LM_time = OD_mat[str(d[1]) + ',' + str(request.dest)]
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
    if (distance < catchment):
        mode = walk
    else:
        mode = shuttle
    return mode

# Assign FM/LM modes (e.g., walk/shuttle) to incoming request
def FMLM_trips(G, request, FR_path, catchment, OD_dist_mat):
    FR_orig = FR_path[0].split('_')[0]
    FR_dest = FR_path[-1].split('_')[0]
    origDist = OD_dist_mat[str(request.orig) + ',' + str(FR_orig)] * 1760.0
    destDist = OD_dist_mat[str(FR_dest) + ',' + str(request.dest)] * 1760.0
    FM_mode = assignFMLM(origDist, catchment)
    LM_mode = assignFMLM(destDist, catchment)
    return FM_mode, LM_mode

# Dont assign travel time to FM and LM walk trips
def multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode):
    if (FM_mode == 0):
        FM_time = 0
    if (LM_mode == 0):
        LM_time = 0
    return FM_time + FR_time + LM_time

def getActionStops(path): 
    stops = [[path[0]]]
    j = 0
    for i in range(1, len(path)):
        if (path[i-1].split('_')[1] != path[i].split('_')[1]):
            stops[j].append(path[i-1])
            stops.append([path[i]])
            j += 1
    if (stops[j][-1] != path[-1]):
        stops[j].append(path[-1])
    return stops


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
            elif (nx.shortest_path_length(G_FR, source=lastStop, target=FR_path[0], weight='travel_time') \
                                          <= filt['arrTime'].iloc[i] - lastStopTime):
                egressTime = filt['arrTime'].iloc[i]
                lastStop = FR_path[0]
                lastStopTime = filt['arrTime'].iloc[i]
            else:
                continue
            FR_path = FR_path[1:]
        if (len(FR_path) == 0):
            egressTime = filt['arrTime'].iloc[i]
            return accessTime, egressTime
        if (i == len(filt)-1) and (len(FR_path) > 0):
            return -1, -1


def getFixedRouteInfo(FR_path, currentTime, busSched, G_FR):
    return getAccessEgress(G_FR, FR_path, currentTime, busSched)


def canTripBeServed(request, FM_mode, LM_mode):
    shuttle = 1
    if (FM_mode == shuttle) and (request.origUrban == False):
        return False
    elif (LM_mode == shuttle) and (request.destUrban == False):
        return False
    else:
        return True
