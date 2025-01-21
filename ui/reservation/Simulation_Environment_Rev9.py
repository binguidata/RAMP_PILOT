from reservation.Shuttle_Rev9 import *
from reservation.Rider_Rev9 import *
from reservation.Modal_Assignment_Rev9 import *
import copy
import time

from . import reservation_config


class Sim(object):
    busSched = pd.read_csv(reservation_config.bus_sched_empty_path)
    with open(reservation_config.OD_dist_mat_path, 'r') as fp:
        OD_dist_mat = json.load(fp)
    with open(reservation_config.OD_time_mat_path, 'r') as fp:
        OD_time_mat = json.load(fp)

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
        self.travDistTimeSpeed = []
        if (ops == 0):
            self.walkCatchment = -1
            self.multiplier = 0.1
        if (ops == 1):
            self.walkCatchment = 400
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
                if (len(shuttle.route) == 1) and (shuttle.route[0][0] == 'idle') and (shuttle.arrTime <= self.time):
                    self.shuttles.remove(shuttle)

    def assignTrip(self, request):
        dirTravTime = getDirectTravelTime(Sim.OD_time_mat, request.orig, request.dest)
        thresh = 0.25
        origInfo = getNearestStops(Sim.OD_time_mat, request.orig, Sim.busSched, dirTravTime, thresh)
        destInfo = getNearestStops(Sim.OD_time_mat, request.dest, Sim.busSched, dirTravTime, thresh)
        print('Simulation_Environment_Rev9.py/assignTrip:', 'origInfo', origInfo, 'destInfo', destInfo)
        FR_path, FR_time, FM_time, LM_time = selectBestFixedRoute(self.G_FR, Sim.OD_time_mat, request, origInfo, destInfo)

        if (FR_path != 'No Feasible Path'):
            catchment = 600
            FM_mode, LM_mode = FMLM_trips(self.G, request, FR_path, catchment, Sim.OD_dist_mat)
            answer = canTripBeServed(request, FM_mode, LM_mode)
            if (answer == False):
                return 'Reject Rider'
            totalTime = multiModalTime(FR_time, FM_time, LM_time, FM_mode, LM_mode)
            threshold = 2.0
            if (totalTime < threshold*dirTravTime) or (request.origUrban == False) or (request.destUrban == False):
                middleLeg = 2
                FR_pickup, FR_dropoff = getFixedRouteInfo(FR_path, request.reqTime, Sim.busSched, self.G_FR)
                request.mode = [FM_mode, middleLeg, LM_mode]
                request.orig_FR = int(FR_path[0].split('_')[0])
                request.dest_FR = int(FR_path[-1].split('_')[0])
                request.FR_deptTime = FR_pickup
                request.FR_arrTime = FR_dropoff
                request.fixedRoute = FR_path
                if FR_pickup == -1:
                    request.mode = [-1, -1, -1]
                    return 'Reject Rider'
            else:
                request.mode = [1, 1, 1]
        else:
            request.mode = [1, 1, 1]
        return 'Accept Rider'


    # change orig/dest based on fixed route assignments
    def reformatRider(self, request):
        if (request.mode == [1,2,0]):
            request.dest = request.orig_FR                          
            request.uniqueID = str(request.uniqueID) + '_FM'
        
        if (request.mode == [1,2,1]) and ('_LM' not in str(request.uniqueID)):
            request.dest = request.orig_FR
            request.uniqueID = str(request.uniqueID) + '_FM'
        
        if (request.mode == [0,2,1]):
            request.uniqueID = str(request.uniqueID) + '_FR'
            FR_pickup, FR_dropoff = getFixedRouteInfo(request.fixedRoute, request.reqTime, Sim.busSched, self.G_FR)
            request.pickupTime = FR_pickup
            request.dropoffTime = FR_dropoff
            request.shuttleID = 'FR'
            uniqueID = str(request.uniqueID).split('_')[0]
            self.remainingRiders.append(rider(uniqueID +'_LM', request.riderID, 
                                              request.dest_FR, request.dest, 
                                              FR_dropoff))
       

        if (request.mode == [0,2,0]):
            FR_pickup, FR_dropoff = getFixedRouteInfo(request.fixedRoute, request.reqTime, Sim.busSched, self.G_FR)
            request.pickupTime = FR_pickup
            request.dropoffTime = FR_dropoff
            request.shuttleID = 'FR'
            request.uniqueID = str(request.uniqueID) + '_FR'

        if (request.mode == [1,1,1]):
            request.uniqueID = str(request.uniqueID) + '_Shuttle'

    def riderAssignment(self):
        timeWindow = 0*60
        remainingRiders = copy.copy(self.remainingRiders)
        for request in remainingRiders:
            if (request.reqTime <= self.time + timeWindow):
                if ('_LM' not in str(request.uniqueID)):
                    riderInfo = self.assignTrip(request)
                    if (riderInfo == 'Reject Rider'):
                        self.rejectedRiders.append(request)
                        self.remainingRiders.remove(request)
                        break
                    else:
                        self.dailyRiders.append(request)
                        self.reformatRider(request)
                if ('_LM' in str(request.uniqueID)) or (request.mode[0] == 1):
                    self.findMinCost(request)
                else:
                    self.remainingRiders.remove(request)


    # Match shuttle with minimum marginal costs
    def findMinCost(self, request):
        penalty = 10**6
        waitTimeThreshold = 60*60*1
        marginalCosts, routes = [], []
        waitTimes = []
        if (len(self.shuttles) > 0):
            for shuttle in self.shuttles:
                if (request.reqTime <= shuttle.endTime):
                    margCost, bestRoute, bestWaitTime = shuttle.getBestRoute(self.G, request, self.alpha, self.beta, self.time)
                    marginalCosts.append(margCost)
                    routes.append(bestRoute)
                    waitTimes.append(bestWaitTime)
                else:
                    marginalCosts.append(penalty)
                    routes.append('placeholder')
                    waitTimes.append(waitTimeThreshold + 1)
            
            bestIndex = marginalCosts.index(min(marginalCosts))
            self.shuttles[bestIndex].route = routes[bestIndex]
            self.shuttles[bestIndex].riderQueue.append(request)
            request.shuttle = self.shuttles[bestIndex].shuttleID
            self.remainingRiders.remove(request)


    # Makes the next trip for the van based on the vehicles pre-determined route
    def getNextTrips(self):
        for shuttle in self.shuttles:
            if (len(shuttle.route) > 1) or (len(shuttle.route[0]) == 3):
                if (shuttle.inTransit == False) and (shuttle.depTime <= self.time):
                    travTime = shuttle.getTravTime(self.G)
                    shuttle.arrTime = self.time + travTime
                    shuttle.inTransit = True


    def addLM_trip(self, LM_rider):
        arrTime = LM_rider.dropoffTime
        FR_pickup, FR_dropoff = getFixedRouteInfo(LM_rider.fixedRoute, arrTime, Sim.busSched, self.G_FR)
        uniqueID = str(LM_rider.uniqueID).split('_')[0]
        if (LM_rider.mode == [1,2,1]):
            LM_rider.FR_deptTime = FR_pickup
            LM_rider.FR_arrTime = FR_dropoff
            self.remainingRiders.append(rider(uniqueID + '_LM', LM_rider.riderID, LM_rider.dest_FR, LM_rider.dropoffLoc, FR_dropoff))
        else:
            FR_rider = rider(uniqueID + '_FR', LM_rider.riderID, LM_rider.orig_FR, LM_rider.dest_FR, FR_pickup)
            FR_rider.FR_deptTime = FR_pickup
            FR_rider.FR_arrTime = FR_dropoff
            self.dailyRiders.append(FR_rider)
            LM_rider.FR_deptTime = FR_pickup
            LM_rider.FR_arrTime = FR_dropoff



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
                if (shuttle.route[0][0] == 'returnToDepot'):
                    shuttle.distanceDepot += shuttle.getTravDist(self.G)
                shuttle.currentLoc = shuttle.route[0][1]
                shuttle.inTransit = False
                LM_rider = shuttle.dropoffRiders()
                if (LM_rider != None):
                    self.addLM_trip(LM_rider)
                shuttle.pickupRiders()
                shuttle.route.pop(0)
                if (shuttle.route == []):
                   shuttle.route.append(('returnToDepot', shuttle.depot, 'returnTrip'))
                   shuttle.route.append(('idle', shuttle.depot))


    def recordOccupancies(self):
        currentOccupancies = [self.time]
        for shuttle in self.shuttles:
            currentOccupancies.append(len(shuttle.currentRiders))
        self.occupancies.append(currentOccupancies)


    def returnOccupancies(self):
        return self.occupancies


    def returnTravDist(self):
        for shuttle in self.shuttles:
            self.travDists.append(shuttle.distance)
        return self.travDists


    def returnTravDistDepot(self):
        for shuttle in self.shuttles:
            self.travDistsDepot.append(shuttle.distanceDepot)
        return self.travDistsDepot


    def returnTravDistTrip(self):
        for shuttle in self.shuttles:
            self.travDistsTrip.append(shuttle.distance - shuttle.distanceDepot)
        return self.travDistsTrip


    def returnTravDistTime(self):
        return self.travDistTime
