import networkx as nx
import pandas as pd
import osmnx as ox

# ====== Steps to assign incoming request to a multi-modal trip ================
# 
# ----- Multimodal options -------
# Mapping:
# 0: walk, 1: shuttle, 2: FR
# walk, FR, walk             (0,2,0)
# walk, FR, shuttle          (0,2,1)
# shuttle, FR, walk          (1,2,0)
# shuttle, FR, shuttle       (1,2,1)
# shuttle, shuttle, shuttle  (1,1,1)   <--- direct door-to-door shuttle trip

# ==============================================================================

# Get the direct travel time using shortest path between origin and destination
def getDirectTravelTime(OD_mat, orig, dest):
    travTime = OD_mat[str(orig) + ',' + str(dest)]
    return travTime

def getDirectTravelDist(OD_dist_mat, orig, dest):
    travDist = OD_dist_mat[str(orig) + ',' + str(dest)]
    return travDist

def variableThresholds(travTime):
    if travTime <= 600:
        return 0.250, 1.50
    elif travTime <= 1200:
        return 0.275, 1.65
    elif travTime <= 1500:
        return 0.300, 1.80
    elif travTime <= 1800:
        return 0.325, 1.95
    elif travTime <= 2100:
        return 0.350, 2.10
    elif travTime <= 2400:
        return 0.375, 2.25
    elif travTime <= 2700:
        return 0.400, 2.40
    elif travTime <= 3000:
        return 0.425, 2.55
    elif travTime <= 3300:
        return 0.450, 2.70
    elif travTime <= 3600:
        return 0.475, 2.85
    else:
        return 0.500, 3.00

# Get nearest stop to orig/dest for each potential bus route
def getNearestStops(OD_mat, location, busSched, dirTravTime, thresh):
    store = []
    # Iterate through all potential bus routes
    for route in busSched['routeID'].unique():
        filt = busSched[busSched['routeID'] == route].copy()
        travTimes, busStops = [],[]
        # Find closest bus stop along given route to the request's orig/dest location
        for busStop in filt['stopNode'].unique():
            busStop = int(busStop)
            travTime = OD_mat[str(location) + ',' + str(busStop)]
            travTimes.append(travTime)
            busStops.append(busStop)
        bestIndex = travTimes.index(min(travTimes))
        bestBusStop = busStops[bestIndex]
        bestTravTime = travTimes[bestIndex]
        # Only consider a given stop if FM or LM travel time < thresh*direct travel time (e.g., 0.25*dirTravTime)
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
                # print('o', o, 'd', d)
                fr_o, fr_d = f'{o[1]}_{o[0]}', f'{d[1]}_{d[0]}'
                # print('fr_o', fr_o, 'fr_d', fr_d)
                # FM travel time
                FM_time = OD_mat[str(request.orig) + ',' + str(o[1])]
                # print('FM_time', FM_time)
                # Fixed Route travel time
                try:
                    FR_path = nx.shortest_path(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                    FR_time = nx.shortest_path_length(G_FR, source=fr_o, target=fr_d, weight='travel_time')
                except:
                    break
                # LM travel time
                LM_time = OD_mat[str(d[1]) + ',' + str(request.dest)]
                travTime = FM_time + FR_time + LM_time
                # print('FR_path in selectBestFixedRoute()', FR_path)
                routes.append(FR_path)
                travTimes.append(travTime)
                # print('        travTime', travTime)
        # print('travTimes', travTimes)
        bestIndex = travTimes.index(min(travTimes))
        bestRoute = routes[bestIndex]
        bestTime = travTimes[bestIndex]
        # print('bestRoute', bestRoute, 'bestTime', bestTime)
    return bestRoute, bestTime, FM_time, LM_time

# find where the passenger make transfer between fixed routes
def findConnnetion(pathFR):
    # print(pathFR)
    connections = []
    _prev_stop = ''
    _curr_stop = ''
    _prev_node = ''
    _curr_node = ''
    _prev_route = ''
    _curr_route = ''
    for i, stop in enumerate(pathFR):
        _curr_stop = stop
        # print('_curr_stop', _curr_stop, 'stop.split', stop.split('_'))
        _curr_node, _curr_route = stop.split('_')
        # _curr_node = stop.split('_')[0]
        # _curr_route = stop.split('_')[1]
        if (_prev_route != '') and (_curr_route != _prev_route):
            # print('_prev_node', _prev_node, '_prev_route', _prev_route, '_prev_stop', _prev_stop)
            # print('_curr_node', _curr_node, '_curr_route', _curr_route, '_curr_stop', _curr_stop)
            connections.append([i, _prev_node, _prev_route, _curr_node, _curr_route])
        _prev_stop = _curr_stop
        _prev_node = _curr_node
        _prev_route = _curr_route
    return connections

# find the boarding time and alighting time for each fixed-route that the passenger takes
def findFixedRouteOrigDestTimes(schedule, busNames, busOrigStops, busDestStops, busOrigTime):
    rounds = [ele for ele in schedule.columns.tolist() if 'round_' in ele]
    _busOrigTime = busOrigTime
    busOrigTimes = []
    busDestTimes = []
    for i in range(len(busNames)):
        _busName = busNames[i]
        _busOrigStop = busOrigStops[i]
        _busDestStop = busDestStops[i]
        # find the row that matches the bus name and stop node
        _tmp = schedule[(schedule['route_name'] == _busName) & (schedule['nearest_node'] == _busOrigStop)][rounds].reset_index(drop=True)
        # find the round number of the fixed-route
        _round_pool = []
        for _round in rounds:
            if _tmp.iloc[0][_round] >= _busOrigTime:
                _round_pool.append(_round)
        _busRound = _round_pool[0]
        # find the boarding time and alighting time of the bus
        _busOrigTime = schedule[(schedule['route_name'] == _busName) & (schedule['nearest_node'] == _busOrigStop)][_busRound].values[0]
        _busDestTime = schedule[(schedule['route_name'] == _busName) & (schedule['nearest_node'] == _busDestStop)][_busRound].values[0]
        # print(_busDestTime)
        busOrigTimes.append(_busOrigTime)
        busDestTimes.append(_busDestTime)
        # prepare for the next bus
        _busOrigTime = _busDestTime
    return busOrigTimes, busDestTimes

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
    # Get FR access/egress nodes
    # print('FR_path', FR_path)
    FR_orig = FR_path[0].split('_')[0]
    FR_dest = FR_path[-1].split('_')[0]
    # print('FR_orig', FR_orig, 'FR_dest', FR_dest)
    # Get access/egress distance
    # origDist = nx.shortest_path_length(G, source=request.orig, target=FR_orig, weight='length')
    # destDist = nx.shortest_path_length(G, source=FR_dest, target=request.dest, weight='length')
    # print('request.orig', request.orig, 'FR_orig', FR_orig)
    # print('FR_dest', FR_dest, 'request.dest', request.dest)
    origDist = OD_dist_mat[str(request.orig) + ',' + str(FR_orig)] * 1760.0
    destDist = OD_dist_mat[str(FR_dest) + ',' + str(request.dest)] * 1760.0
    # Assign FM and LM modes
    FM_mode = assignFMLM(origDist, catchment)
    LM_mode = assignFMLM(destDist, catchment)
    return FM_mode, LM_mode

# Dont assign travel time to FM and LM walk trips
def multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode):
    # Don't include walking time --> assume walkers know bus schedule
    if (FM_mode == 0):
        FM_time = 0
    if (LM_mode == 0):
        LM_time = 0
    return FM_time + FR_time + LM_time

# Get all access/egress/transfer stops <-- used to compute boarding and arrival times 
# based on actual bus schedule
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

# # Get access/egress time for fixed route bus trip based on actual bus schedule
# def getAccessEgress(FR_path, currentTime, busSched):
#     print('getAccessEgress ...')
#     print('FR_path', FR_path, 'currentTime', currentTime)
#     filt = busSched[busSched['arrTime'] >= currentTime].copy()
#     filt['stopInfo'] = filt['stopNode'].astype(str) + '_' + filt['routeID']
#     for round in filt['variable'].unique():
#         filt1 = filt[filt['variable'] == round].sort_values(by='arrTime').copy()
#         roundStops = list(filt1['stopInfo'].unique())
#         for round in filt['variable'].unique():
#             filt1 = filt[filt['variable'] == round].sort_values(by='arrTime').copy()
#             roundStops = list(filt1['stopInfo'].unique())
#             if (FR_path[0] in roundStops) and (FR_path[-1] in roundStops): # [add something about the order]
#                 j = 0
#                 for i in range(len(filt1)):
#                     if (FR_path[0] == filt1['stopInfo'].iloc[i]):
#                         if (j == 0):
#                             accessTime = filt1['arrTime'].iloc[i]
#                             j = 1
#                         FR_path = FR_path[1:]
#                     if (len(FR_path) == 0):
#                         egressTime = filt1['arrTime'].iloc[i]
#                         return accessTime, egressTime
#             else: # then what? 
#                 continue

# # Check if a FR path is possible
# def checkFeasibility(FR_path, orderedStops):
#     check = all(elem in orderedStops for elem in FR_path)
#     oldIndex = 0
#     if (check == True):
#         for stop in FR_path:
#             currentIndex = orderedStops.index(stop)
#             if (currentIndex > oldIndex):
#                 oldIndex = currentIndex
#             else:
#                 return False
#     else:
#         return True

# Get access/egress time for fixed route bus trip based on actual bus schedule
# def getAccessEgress(FR_path, currentTime, busSched):
#     # print('getAccessEgress ...')
#     # print('FR_path', FR_path, 'currentTime', currentTime)
#     filt = busSched[busSched['arrTime'] >= currentTime].copy()
#     filt['stopInfo'] = filt['stopNode'].astype(str) + '_' + filt['routeID']
#     for round in filt['variable'].unique():
#         # print('round', round)
#         filt1 = filt[filt['variable'] == round].sort_values(by='arrTime').copy()
#         roundStops = list(filt1['stopInfo'].unique())
#         # print('roundStops', roundStops)
#         if ((FR_path[0] in roundStops) and (FR_path[-1] in roundStops)) and \
#             (roundStops.index(FR_path[0]) < roundStops.index(FR_path[-1])): # [add something about the order]
#             # print('both orig and dest stops are in the roundStops.')
#             j = 0
#             for i in range(len(filt1)):
#                 if (FR_path[0] == filt1['stopInfo'].iloc[i]):
#                     if (j == 0):
#                         accessTime = filt1['arrTime'].iloc[i]
#                         j = 1
#                     FR_path = FR_path[1:]
#                 if (len(FR_path) == 0):
#                     egressTime = filt1['arrTime'].iloc[i]
#                     return accessTime, egressTime
#         else: # then what? 
#             # print('either orig or dest stop is not in the roundStops.')
#             continue
#     return -1, -1

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

# # assume no fixed route service
# def getAccessEgress(G_FR, FR_path, currentTime, busSched):
#     return -1, -1

def getFixedRouteInfo(FR_path, currentTime, busSched, G_FR):
    return getAccessEgress(G_FR, FR_path, currentTime, busSched)

# # Find access and egress times for given bus path
# def getFixedRouteInfo(FR_path, currentTime, busSched):
#     FR_path_rev = getActionStops(FR_path)
#     # print('FR_path_rev', FR_path_rev)
#     i = 0
#     for path in FR_path_rev:
#         boardTime, arrTime = getAccessEgress(path, currentTime, busSched)
#         if (i == 0):
#             accessTime = boardTime
#             currentTime = arrTime
#             i = 1
#         egressTime = arrTime
#     if (egressTime != -1) and (accessTime != -1):
#         return accessTime, egressTime
#     else:
#         return -1, -1

# No access to on-demand shuttles outside of service area
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
