import networkx as nx
import pandas as pd

# Add transfer segment links between routes
def addTransferSegments(G1, stops):
    # transPenalty = 10*60
    transPenalty = 1*60
    for stop1 in stops:
        for stop2 in stops:
            # This only works when the transfer is at the same stop
            # Can easily change to include a walking catchment area just by checking the distance
            if ((stop1.split('_')[0] == stop2.split('_')[0]) and (stop1.split('_')[1] != stop2.split('_')[1])):
                G1.add_nodes_from([stop1, stop2])
                G1.add_edge(stop1, stop2, travel_time=transPenalty)

    return G1

# Get segments (edges) for fixed-route network
def create_FR_graph(busSched):
    G1 = nx.MultiDiGraph()
    stops = []
    for route in busSched['routeID'].unique():
        routeInfo = busSched[busSched['routeID'] == route].copy()
        for round in routeInfo['variable'].unique():
            filt = routeInfo[routeInfo['variable'] == round].sort_values(by='arrTime').copy()
            for i in range(len(filt)-1):
                stop1 = str(filt['stopNode'].iloc[i]) + '_' + str(route)
                # print('stop1', stop1)
                stop2 = str(filt['stopNode'].iloc[i+1]) + '_' + str(route)
                # print('stop2', stop2)
                travTime = filt['arrTime'].iloc[i+1] - filt['deptTime'].iloc[i]
                if (stop1 not in set(G1.nodes())):
                    G1.add_node(stop1)
                    stops += [stop1]
                if (stop2 not in set(G1.nodes())):
                    G1.add_node(stop2)
                    stops += [stop2]
                if ((stop1, stop2, 0) not in G1.edges):
                    G1.add_edge(stop1, stop2, travel_time=travTime)
    uniqueStops = list(set(stops))
    G2 = addTransferSegments(G1, uniqueStops)
    return G2
