import copy
import networkx as nx
import time
import json

from . import reservation_config


class shuttle(object):
    def __init__(self, shuttleID, shuttleCapacity, startLocation, startTime, endTime, G):
        self.shuttleID = shuttleID
        self.capacity = shuttleCapacity
        self.currentLoc = startLocation
        self.depot = startLocation
        self.startTime = startTime
        self.endTime = endTime
        self.G = G
        self.currentRiders = []
        self.riderQueue = []
        self.route = [('idle', startLocation)]
        self.inTransit = False
        self.depTime = startTime
        self.arrTime = startTime - 15
        self.distance = 0
        self.distanceDepot = 0
        with open(reservation_config.OD_dist_mat_path, 'r') as fp:
           self.ODDistMat = json.load(fp)
        with open(reservation_config.OD_time_mat_path, 'r') as fp:
           self.ODTimeMat = json.load(fp)

    def __repr__(self):
        return f'shuttle: ({self.shuttleID})'


    # Add rider to shuttle
    def addRiderToShuttle(self, request):
        self.currentRiders.append(request)
        self.riderQueue.remove(request)
    
    # Pickup riders
    def pickupRiders(self):
        riderQueue = copy.copy(self.riderQueue)
        for request in riderQueue:
            if (len(self.route[0]) > 2) and (self.route[0][0] != 'returnToDepot') and (request.riderID == self.route[0][0].riderID) and \
                (request.orig == self.route[0][1]) and (self.route[0][2] == 'pickup'):
                self.addRiderToShuttle(request)
                self.depTime = max(self.arrTime, request.reqTime) + 15
                request.pickupTime = max(self.arrTime, request.reqTime)

    # Dropoff riders
    def dropoffRiders(self):
        currentRiders = copy.copy(self.currentRiders)
        for request in currentRiders:
            if (request.dest == self.currentLoc) and (request.riderID == self.route[0][0].riderID):
                request.dropoffTime = self.arrTime
                self.currentRiders.remove(request)
                if (request.mode == [1,2,1]) or (request.mode == [1,2,0]):
                    return request
                else:
                    return None

    # Get wait and in-vehicle times for current/in-queue passengers based on route
    def getWaitDriveTimes(self, route, currTime):
        dwellTime = 15
        maxWait = 120*60
        maxDrive = 120*60
        if (len(route[0]) > 2) and (route[0][2] == 'pickup'):
            cummTime = max(route[0][0].reqTime, self.arrTime)
            totalWait = max(self.arrTime - route[0][0].reqTime, 0)
            totalDrive = 0
            route[0][0].temp = cummTime
        elif (len(route[0]) > 2) and (route[0][2] == 'dropoff'):
            cummTime = self.arrTime
            totalWait = 0

            totalDrive = self.arrTime - route[0][0].pickupTime
        elif (len(route[0]) > 2) and (route[0][2] == 'returnTrip'):
            cummTime = self.arrTime
            totalWait, totalDrive = 0, 0
        else:
            cummTime = currTime
            totalWait, totalDrive = 0, 0
        for i in range(len(route) - 1):
            pathTime = self.ODTimeMat[str(route[i][1]) + ',' + str(route[i+1][1])] + dwellTime
            if (len(route[i+1]) > 2):
                cummTime = max(cummTime + pathTime, route[i+1][0].reqTime)
                if (route[i+1][2] == 'pickup'):
                    wait = cummTime - route[i+1][0].reqTime
                    if (wait > maxWait):
                        totalWait += 100000
                        route[i+1][0].temp = cummTime
                    else:
                        totalWait += max(wait, 0)
                        route[i+1][0].temp = cummTime
                elif (route[i+1][2] == 'dropoff'):
                    if (route[i+1][0].pickupTime != None):
                        drive = cummTime - route[i+1][0].pickupTime
                        if (drive > maxDrive):
                            totalDrive += 100000
                        else:
                            totalDrive += drive
                    else: 
                        drive = cummTime - route[i+1][0].temp
                        if (drive > maxDrive):
                            totalDrive += 100000
                        else:
                            totalDrive += cummTime - route[i+1][0].temp
                else:
                    continue
            else:
                cummTime += pathTime
        return totalWait, totalDrive


    def checkMaxCapacity(self, route):
        t1 = time.time()
        maxCap = len(self.currentRiders)
        for stop in route:
            if (len(stop) == 3):
                if (stop[2] == 'pickup'):
                    maxCap += 1
                    if (maxCap > self.capacity):
                        return 'not enough seats!'
                elif (stop[2] == 'dropoff') and (maxCap > 0):
                    maxCap -= 1
                else:
                    continue
        return 'enough seats'

    # Compute the best route using the insertion heuristic
    def getBestRoute(self, G, request, alpha, beta, currTime): #alpha=wait, beta=in-vehicle
        t1 = time.time()
        storeRoutes, storeRouteCosts = [], []
        storeWaitTime = []
        newRoute = copy.copy(self.route)
        baseWait, baseDrive = self.getWaitDriveTimes(newRoute, currTime)
        if (self.route[0][0] == 'returnToDepot'):
           startIndex = 2
        else:
            startIndex = 1
        for i in range(startIndex, len(newRoute)+1):
            newRoute.insert(i, (request, request.orig, 'pickup'))
            for j in range(i+1, len(newRoute)+1):
                newRoute.insert(j, (request, request.dest, 'dropoff'))
                if (self.checkMaxCapacity(newRoute) == 'not enough seats!'):
                   newRoute.pop(j)
                   continue
                waitTime, driveTime = self.getWaitDriveTimes(newRoute, currTime)
                storeRouteCosts.append(alpha*(waitTime-baseWait) + beta*(driveTime-baseDrive))
                storeRoutes.append(copy.copy(newRoute))
                storeWaitTime.append(waitTime)
                newRoute.pop(j)
            newRoute.pop(i)
        bestIndex = storeRouteCosts.index(min(storeRouteCosts))
        minCost = storeRouteCosts[bestIndex]
        bestRoute = storeRoutes[bestIndex]
        bestWaitTime = storeWaitTime[bestIndex]
        t2 = time.time()
        return minCost, bestRoute, bestWaitTime


    def getTravTime(self, G):
        travTime = self.ODTimeMat[str(self.currentLoc) + ',' + str(self.route[0][1])]
        return travTime


    def getTravDist(self, G):
        travDist = self.ODDistMat[str(self.currentLoc) + ',' + str(self.route[0][1])]
        return travDist
