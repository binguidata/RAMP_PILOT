from Shuttle_Rev11 import *
from Rider_Rev11 import *
from Modal_Assignment_Rev11 import *
import copy
import time

class Sim(object):
    originalBusSchedule = pd.read_csv('../common_files/schedule_all_sec.csv')
    busSched = pd.read_csv('../common_files/busTimeTable_Greene.csv')
    with open('../common_files/odTravTime_Greene.json', 'r') as fp:
        OD_mat = json.load(fp)
    with open('../common_files/odTravDist_Greene.json', 'r') as fp:
        OD_dist_mat = json.load(fp)

    def __init__(self, riders, shuttles, G, G1, alpha, beta, ops):
        self.time = min([shuttle.startTime for shuttle in shuttles])
        self.dailyRiders = []
        self.rejectedRiders = []
        self.remainingRiders = copy.copy(riders)
        self.shuttleList = shuttles
        self.shuttles = []
        self.G = G
        self.G_FR = G1
        self.alpha = alpha
        self.beta = beta
        self.timeStep = 5
        self.occupancies = []
        self.travDists = []
        self.travDistsDepot = []
        self.travDistsTrip = []
        self.travDistTime = []
        # self.travDistTimeSpeed = []
        self.travDistTimeOccu = []
        if (ops == 0): # <--- On-demand
            self.walkCatchment = -1  # size of walking catchment
            self.multiplier = 0.1     # travel time multiplier
        if (ops == 1): # <--- Fixed route + on-demand
            self.walkCatchment = 400  # meters
            self.multiplier = 10


    # Define time step (1 second)
    def step(self):
        self.time += self.timeStep


    # Return list of served riders at the end of the simulation
    def returnRiders(self):
        return self.dailyRiders, self.rejectedRiders


    # Activate vans based on their start times
    def activateVans(self):
        shuttleList = copy.copy(self.shuttleList)
        for shuttle in shuttleList:
            if (shuttle.startTime <= self.time) and (shuttle.startTime + self.timeStep > self.time):
                self.shuttles.append(shuttle)


    # Deactivate vans based on their end times
    def deactivateVans(self):
        shuttleList = copy.copy(self.shuttles)
        for shuttle in shuttleList:
            if (shuttle.endTime <= self.time):
                # Shuttle must finish service current passengers and return to depot before ending shift
                if (len(shuttle.route) == 1) and (shuttle.route[0][0] == 'idle') and (shuttle.arrTime <= self.time):
                    self.shuttles.remove(shuttle)


    # ==========================================================================
    # The following section assigns all trip segments to incoming requests
    # Note: Functions below are from Modal_Assignment.py

    # Step 1: Compute direct travel time for direct orig --> dest using shuttle (non-shared) 
    # Step 2: Select feasible access/egress fixed route stops given the request's orig/dest
    # Step 3: Select the best fixed route option, and return route and travel time 
    #         Note - actual bus schedule is not used, only bus travel times for shortest path calculation
    # Step 4: Check if access/egress stops for best fixed route option can be accessed by walking
    # Step 5: Check if request is feasible (no on-demand shuttles outside of service area)
    # Step 6: Calculate total multimodal trip time 
    # Step 7: Choose either 1) multi-modal trip using fixed route or 2) on-demand, door-2-door shuttle 
    #         based on total travel time for each option


    # Assign incoming request to best possible shuttle
    def assignTrip(self, request):
        # ========== Multimodal options ==========
        # 0: walk, 1: shuttle, 2: FR (fixed route)
        # e.g., [shuttle, FR, walk] = [1,2,0]

        # print('request', request.orig, request.dest)

        # Step 1: 
        # Calculate direct O --> D travel time 
        dirTravTime = getDirectTravelTime(Sim.OD_mat, request.orig, request.dest)
        # print('dirTravTime', dirTravTime)

        # Step 2:
        # Find potential fixed route stops/routes (orig and dest)
        FRThreshold, multiModalThreshold = variableThresholds(travTime=dirTravTime)
        # print('FRThreshold', FRThreshold, 'multiModalThreshold', multiModalThreshold)
        origInfo = getNearestStops(Sim.OD_mat, request.orig, Sim.busSched, dirTravTime, FRThreshold)
        destInfo = getNearestStops(Sim.OD_mat, request.dest, Sim.busSched, dirTravTime, FRThreshold)
        # print('origInfo', origInfo, 'destInfo', destInfo)
        # origInfo [('nc2ob', 4934252796), ('nc82ob', 6714701857), ('nc75ib', 7130891354), ('nc82ib', 7130891354)]
        # destInfo [('nc2ob', 4934253708), ('nc1', 7052056759), ('nc2ib', 7052056759), ('nc75ob', 8562639200)]

        # [add function] add some notes here
        # [(route, bestStop),(route2, bestStop2)]

        # Step 3:
        # Find the best fixed route option for the request given origin/destination
        FR_path, FR_time, FM_time, LM_time = selectBestFixedRoute(self.G_FR, Sim.OD_mat, request, origInfo, destInfo)
        # print('FR_path', FR_path, 'FR_time', FR_time, 'FM_time', FM_time, 'LM_time', LM_time)

        if (FR_path != 'No Feasible Path'):
            # Step 4: 
            # Can the stops be accessed by walking
            catchment = 600 # meters away from transit station
            FM_mode, LM_mode = FMLM_trips(self.G, request, FR_path, catchment, Sim.OD_dist_mat)
            # print('FMLM_trips() - FM_mode', FM_mode, 'LM_mode', LM_mode)

            # Step 5: [Need to write this function]
            # Check if request can be served
            # Requirement:
            #   1) If orig/dest outside of service area --> must be within walking distance of fixed route stop
            answer = canTripBeServed(request, FM_mode, LM_mode)
            if (answer == False):
                return 'Reject Rider'

            # Step 6:
            # Calculate multi-modal trip time
            totalTime = multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode)
            # print('totalTime', totalTime)

            # Step 7:
            # Compare multi-modal trip time with direct travel time to determine modal assignment
            # multiModalThreshold: multi-modal option cannot be more than 1.5x longer the direct door-to-door trip 
            if (totalTime < multiModalThreshold*dirTravTime) or (request.origService == False) or (request.destService == False):
                middleLeg = 2 # <-- assign fixed-route
                # Get FR departure/arrival times
                FR_pickup, FR_dropoff = getFixedRouteInfo(FR_path, request.reqTime, Sim.busSched, self.G_FR)
                # # need to reassign this trip, but temporarily set it reject rider
                # if FR_pickup == -1:
                #     return 'Reject Rider'
                # Assign mode to request
                request.mode = [FM_mode, middleLeg, LM_mode]
                request.fixedRoute = FR_path
                request.orig_FR = int(FR_path[0].split('_')[0])
                request.dest_FR = int(FR_path[-1].split('_')[0])
                request.FR_deptTime = FR_pickup
                request.FR_arrTime = FR_dropoff
                connections = findConnnetion(FR_path)
                # print('len(connections)', len(connections))
                # # only take one fixed route
                # if len(connections) == 0:
                #     request.orig_FR = int(FR_path[0].split('_')[0])
                #     request.dest_FR = int(FR_path[-1].split('_')[0])
                #     request.FR_deptTime = FR_pickup
                #     request.FR_arrTime = FR_dropoff

                # # take two fixed routes
                # elif len(connections) == 1:
                #     request.orig_FR = int(FR_path[0].split('_')[0])
                #     request.dest_FR = int(FR_path[-1].split('_')[0])
                #     request.FR_deptTime = FR_pickup
                #     request.FR_arrTime = FR_dropoff
                # only take one fixed route
                request.fixedRouteNames.append(FR_path[0].split('_')[1])
                request.fixedRouteBoardingStops.append(int(FR_path[0].split('_')[0]))
                request.fixedRouteAlightingStops.append(int(FR_path[-1].split('_')[0]))
                request.fixedRouteBoardingTimes.append(FR_pickup)
                request.fixedRouteAlightingTimes.append(FR_dropoff)
                # take multiple fixed routes
                if len(connections) > 0:
                    for i in range(len(connections)):
                        request.fixedRouteNames.append(connections[i][4])
                        request.fixedRouteBoardingStops.append(int(connections[i][3]))
                        insert_position = len(request.fixedRouteAlightingStops) - 1
                        request.fixedRouteAlightingStops.insert(insert_position, int(connections[i][3]))
                    request.fixedRouteBoardingTimes, request.fixedRouteAlightingTimes = findFixedRouteOrigDestTimes(
                        schedule=Sim.originalBusSchedule, 
                        busNames=request.fixedRouteNames, 
                        busOrigStops=request.fixedRouteBoardingStops, 
                        busDestStops=request.fixedRouteAlightingStops, 
                        busOrigTime=FR_pickup)
                # need to reassign this trip, but temporarily set it reject rider
                if FR_pickup == -1:
                    request.mode = [-1, -1, -1]
                    return 'Reject Rider'
            else:
                request.mode = [1, 1, 1]# <-- assign shuttle
        else:
            answer = canTripBeServedByShuttle(request)
            if (answer == False):
                return 'Reject Rider'
            else:
                request.mode = [1, 1, 1] # <-- assign request to shuttle because no feasible FR offerings exist
        return 'Accept Rider'


    # change orig/dest based on fixed route assignments
    def reformatRider(self, request):
        # [shuttle, fixed-route, walk]
        if (request.mode == [1,2,0]):
            # request.dest = request.orig_FR
            request.dest = request.fixedRouteBoardingStops[0]
            request.uniqueID = str(request.uniqueID) + '_FM'
        
        # [shuttle, fixed-route, shuttle]
        if (request.mode == [1,2,1]) and ('_LM' not in str(request.uniqueID)):
            # request.dest = request.orig_FR
            request.dest = request.fixedRouteBoardingStops[0]
            request.uniqueID = str(request.uniqueID) + '_FM'
        
        # [walk, fixed-route, shuttle]
        if (request.mode == [0,2,1]):
            request.uniqueID = str(request.uniqueID) + '_FR'
            # FR_pickup, FR_dropoff = getFixedRouteInfo(request.fixedRoute, request.reqTime, Sim.busSched, self.G_FR)
            # request.pickupTime = FR_pickup
            # request.dropoffTime = FR_dropoff
            request.pickupTime = request.fixedRouteBoardingTimes[0]
            request.dropoffTime = request.fixedRouteAlightingTimes[-1]
            # request.shuttleID = 'FR'
            uniqueID = str(request.uniqueID).split('_')[0]
            self.remainingRiders.append(rider(uniqueID +'_LM', request.riderID, 
                                              request.fixedRouteAlightingStops[-1], request.dest, 
                                              request.fixedRouteAlightingTimes[-1]))
       
        # [walk, fixed-route, walk]
        if (request.mode == [0,2,0]):
            # FR_pickup, FR_dropoff = getFixedRouteInfo(request.fixedRoute, request.reqTime, Sim.busSched, self.G_FR)
            # request.pickupTime = FR_pickup
            # request.dropoffTime = FR_dropoff
            request.pickupTime = request.fixedRouteBoardingTimes[0]
            request.dropoffTime = request.fixedRouteAlightingTimes[-1]
            # request.shuttleID = 'FR'
            request.uniqueID = str(request.uniqueID) + '_FR'

        # [on-demand shuttle to serve complete trip]
        if (request.mode == [1,1,1]):
            request.uniqueID = str(request.uniqueID) + '_Shuttle'


    # Assign on-demand riders to shuttles
    def riderAssignment(self):
        timeWindow = 0*60
        remainingRiders = copy.copy(self.remainingRiders)
        for request in remainingRiders:
            if (request.reqTime <= self.time + timeWindow):
                # print('riderAssignment() -', request.uniqueID, request.riderID, request.pickupLoc, request.dropoffLoc, request.reqTime)
                if ('_LM' not in str(request.uniqueID)):
                    # print('riderAssignment() - _LM not in request.uniqueID')
                    riderInfo = self.assignTrip(request)
                    if (riderInfo == 'Reject Rider'):
                        self.rejectedRiders.append(request)
                        self.remainingRiders.remove(request)
                        break
                    else:
                        self.dailyRiders.append(request)
                        self.reformatRider(request)
                # Find best shuttle for LM or FM trips
                # if ('_LM' in str(request.uniqueID)) or (request.mode[0] == 1):
                #     print('riderAssignment() - _LM in request.uniqueID or request.mode[0] == 1')
                #     self.dailyRiders.append(request)
                #     self.findMinCost(request)
                if (request.mode is not None) and (request.mode[0] == 1):
                    # print('riderAssignment() - request.mode[0] == 1')
                    self.findMinCost(request)
                elif ('_LM' in str(request.uniqueID)):
                    # print('riderAssignment() - _LM in request.uniqueID')
                    self.dailyRiders.append(request)
                    self.findMinCost(request)
                else:
                    # print('riderAssignment() - else')
                    self.remainingRiders.remove(request)


    # Match shuttle with minimum marginal costs
    def findMinCost(self, request):
        # print('findMinCost() -', request.uniqueID)
        penalty = 10**6
        # penalty = 9000
        waitTimeThreshold = 60*60*1
        marginalCosts, routes = [], []
        waitTimes = []
        # print('time:', self.time)
        if (len(self.shuttles) > 0):
            for shuttle in self.shuttles:
                if (request.reqTime <= shuttle.endTime):
                    # print('getBestRoute()')
                    margCost, bestRoute, bestWaitTime = shuttle.getBestRoute(self.G, request, self.alpha, self.beta, self.time)
                    marginalCosts.append(margCost)
                    routes.append(bestRoute)
                    waitTimes.append(bestWaitTime)
                else: # Don't accept new riders after the shuttle scheduled to conclude service
                    marginalCosts.append(penalty)
                    routes.append('placeholder')
            # If all working shuttles are serving their final passengers before they conclude their shift,
            # New riders must wait until new shuttles begin service
            # if (min(marginalCosts) >= penalty):
            #     print('No in-service shuttles for: ', request)
            # else:
            #     bestIndex = marginalCosts.index(min(marginalCosts))
            #     self.shuttles[bestIndex].route = routes[bestIndex]
            #     self.shuttles[bestIndex].riderQueue.append(request)
            #     request.shuttle = self.shuttles[bestIndex].shuttleID
            #     self.remainingRiders.remove(request)
            if (min(waitTimes) >= waitTimeThreshold):
                # print('No in-service shuttles for: ', request)
                self.rejectedRiders.append(request)
                self.remainingRiders.remove(request)
            else:
                bestIndex = marginalCosts.index(min(marginalCosts))
                self.shuttles[bestIndex].route = routes[bestIndex]
                self.shuttles[bestIndex].riderQueue.append(request)
                request.shuttle = self.shuttles[bestIndex].shuttleID
                if ('_LM' in str(request.uniqueID)):
                    request.shuttleLM = self.shuttles[bestIndex].shuttleID
                else:
                    request.shuttleFM = self.shuttles[bestIndex].shuttleID
                self.remainingRiders.remove(request)


    # Makes the next trip for the van based on the vehicles pre-determined route
    def getNextTrips(self):
        for shuttle in self.shuttles:
            # Do not execute the following code when the shuttle is idle at depot
            if (len(shuttle.route) > 1) or (len(shuttle.route[0]) == 3):
                if (shuttle.inTransit == False) and (shuttle.depTime <= self.time):
                    travTime = shuttle.getTravTime(self.G)
                    shuttle.arrTime = self.time + travTime
                    shuttle.inTransit = True


    def addLM_trip(self, LM_rider):
        arrTime = LM_rider.dropoffTime
        FR_pickup, FR_dropoff = getFixedRouteInfo(LM_rider.fixedRoute, arrTime, Sim.busSched, self.G_FR)
        uniqueID = str(LM_rider.uniqueID).split('_')[0]
        # print('uniqueID:', uniqueID)
        if (LM_rider.mode == [1,2,1]):
            # print('addLM_trip() - [1, 2, 1]')
            LM_rider.FR_deptTime = FR_pickup
            LM_rider.FR_arrTime = FR_dropoff
            self.remainingRiders.append(rider(uniqueID + '_LM', LM_rider.riderID, LM_rider.dest_FR, LM_rider.dropoffLoc, FR_dropoff))
        else: # LM_rider.mode == [1,2,0]
            # print('addLM_trip() - [1, 2, 0]')
            FR_rider = rider(uniqueID + '_FR', LM_rider.riderID, LM_rider.orig_FR, LM_rider.dest_FR, FR_pickup)
            FR_rider.FR_deptTime = FR_pickup
            FR_rider.FR_arrTime = FR_dropoff
            self.dailyRiders.append(FR_rider)
            LM_rider.FR_deptTime = FR_pickup
            LM_rider.FR_arrTime = FR_dropoff


    # Moved shuttles between locations
    def moveShuttles(self):
        dwellTime = 15
        for shuttle in self.shuttles:
            if (shuttle.arrTime <= self.time) and (shuttle.inTransit == True):
                if (shuttle.route[0][0] != 'idle') and (shuttle.currentLoc != shuttle.route[0][1]):
                    shuttle.depTime = shuttle.arrTime + dwellTime
                else:
                    shuttle.depTime = shuttle.arrTime
                shuttle.distance += shuttle.getTravDist(self.G)
                self.travDistTime.append([shuttle.getTravDist(self.G), shuttle.getTravTime(self.G)])
                # self.travDistTimeSpeed.append([shuttle.getTravDist(self.G), shuttle.getTravTime(self.G), shuttle.getTravDist(self.G)/shuttle.getTravTime(self.G)*3600.0])
                self.travDistTimeOccu.append([shuttle.getTravDist(self.G), shuttle.getTravTime(self.G), len(shuttle.currentRiders)])
                # if (shuttle.route[0][0] == 'returnToDepot') or (shuttle.route[0][0] == 'idle'):
                if (shuttle.route[0][0] == 'returnToDepot'):
                    shuttle.distanceDepot += shuttle.getTravDist(self.G)
                shuttle.currentLoc = shuttle.route[0][1]
                shuttle.inTransit = False
                LM_rider = shuttle.dropoffRiders()
                if (LM_rider != None):
                    self.addLM_trip(LM_rider)
                shuttle.pickupRiders()
                shuttle.route.pop(0)
                # ===== Shuttles idle at location of last dropoff =================
                # if (shuttle.route == []):
                #     shuttle.route.append(('idle', shuttle.currentLoc))
                # ===== Shuttles return to transfer station after last dropoff ====
                if (shuttle.route == []):
                   shuttle.route.append(('returnToDepot', shuttle.depot, 'returnTrip'))
                   shuttle.route.append(('idle', shuttle.depot))


    # Record occupancies of shuttles (every 5 minutes)
    def recordOccupancies(self):
        currentOccupancies = [self.time]
        for shuttle in self.shuttles:
            currentOccupancies.append(len(shuttle.currentRiders))
        self.occupancies.append(currentOccupancies)


    # Return list of occupancies
    def returnOccupancies(self):
        return self.occupancies


    # Return list of shuttle travel distances
    def returnTravDist(self):
        for shuttle in self.shuttles:
            self.travDists.append(shuttle.distance)
        return self.travDists


    # Return list of shuttle travel (from/to depot) distances
    def returnTravDistDepot(self):
        for shuttle in self.shuttles:
            self.travDistsDepot.append(shuttle.distanceDepot)
        return self.travDistsDepot


    # Return list of shuttle travel (from/to depot) distances
    def returnTravDistTrip(self):
        for shuttle in self.shuttles:
            self.travDistsTrip.append(shuttle.distance - shuttle.distanceDepot)
        return self.travDistsTrip


    # Return list of shuttles' travel distance, time
    def returnTravDistTime(self):
        return self.travDistTime


    # Return list of shuttles' travel distance, time, occupancy
    def returnTravDistTimeOccu(self):
        return self.travDistTimeOccu
