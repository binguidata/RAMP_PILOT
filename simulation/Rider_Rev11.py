class rider(object):
    def __init__(self, uniqueID, riderID, origNode, destNode, requestTime, origService=True, destService=True):
        self.uniqueID = uniqueID
        self.riderID = riderID
        self.pickupLoc = origNode
        self.dropoffLoc = destNode
        self.orig = origNode
        self.dest = destNode
        self.origService = origService
        self.destService = destService
        self.reqTime = requestTime
        self.fixedRoute = ['','']
        # self.fixedRoute = []
        self.mode = None
        self.pickupTime = None
        self.dropoffTime = None
        self.orig_FR = None
        self.dest_FR = None
        self.FR_arrTime = None
        self.FR_deptTime = None
        self.shuttle = None
        self.temp = None

        self.pickupLocFM = None
        self.pickupTimeFM = None
        self.dropoffLocFM = None
        self.dropoffTimeFM = None
        self.shuttleFM = None
        
        self.fixedRouteNames = []
        self.fixedRouteBoardingStops = []
        self.fixedRouteBoardingTimes = []
        self.fixedRouteAlightingStops = []
        self.fixedRouteAlightingTimes = []

        self.pickupLocLM = None
        self.pickupTimeLM = None
        self.dropoffLocLM = None
        self.dropoffTimeLM = None
        self.shuttleLM = None

        self.shuttleODTravelTime = None
        self.shuttlePickupWaitingTime = None
        self.shuttleInVehicleTime = None

    def __repr__(self):
        return f'Rider: ({self.riderID})'
