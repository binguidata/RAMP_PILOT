class rider(object):
    def __init__(self, uniqueID, riderID, origNode, destNode, requestTime, origUrban=True, destUrban=True):
        self.uniqueID = uniqueID
        self.riderID = riderID
        self.pickupLoc = origNode
        self.dropoffLoc = destNode
        self.orig = origNode
        self.dest = destNode
        self.origUrban = origUrban
        self.destUrban = destUrban
        self.reqTime = requestTime
        self.fixedRoute = ['','']
        self.mode = None
        self.pickupTime = None
        self.dropoffTime = None
        self.orig_FR = None
        self.dest_FR = None
        self.FR_arrTime = None
        self.FR_deptTime = None
        self.shuttle = None
        self.temp = None

    def __repr__(self):
        return f'Rider: ({self.riderID})'






