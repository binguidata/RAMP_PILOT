import pandas as pd
import networkx as nx

# Get the next fixed-route departure time
def get_FR_deptTime(row, busSched):
    if ('_FM' in row['uniqueID']):
        arrTime = row['dropoff_Sim']
    else:
        arrTime = row['reqTime']
    origStop, origRoute = int(str(row['FR'][0]).split('_')[0]), str(row['FR'][0]).split('_')[1]
    FR_deptTime = busSched[(busSched['deptTime'] >= arrTime) & (busSched['stopNode'] == origStop) & 
                           (busSched['routeID'] == origRoute)]['deptTime'].iloc[0]
    return FR_deptTime

# 
def formatTrips(G, data, busSched):
    for index, row in data.iterrows():
        print(row['uniqueID'], row['mode'])
        # For trips that require a shuttle to connect to a fixed-route for a FM trip
        if ('_FM' in row['uniqueID']):
            FR_deptTime = get_FR_deptTime(row, busSched)
            
            origStop = int(str(row['FR'][0]).split('_')[0])
            destStop = int(str(row['FR'][1]).split('_')[0])
            
            row1 = [row['riderID'], row['date'], row['mode'], row['reqTime'], row['orig'], row['dest'], 
                    row['pickup_Sim'], row['dropoff_Sim'], origStop, destStop, FR_deptTime]
            
        #  Walk --> fixed-route --> walk
        elif (('_FR' in row['uniqueID']) and (row['mode'] == [0,2,0])):
            FR_deptTime = get_FR_deptTime(row, busSched)
            origStop = int(str(row['FR'][0]).split('_')[0])
            destStop = int(str(row['FR'][1]).split('_')[0])
            FM_pathDist = nx.shortest_path_length(G, source=row['orig'], target=origStop, weight='length')
            FM_walkTime = FM_pathDist/1.4
            LM_pathDist = nx.shortest_path_length(G, source=destStop, target=row['dest'], weight='length')
            LM_walkTime = LM_pathDist/1.4
            arrTime = row['FR_arr'] + LM_walkTime
            row1 = [row['riderID'], row['date'], row['mode'], row['reqTime'], row['orig'], origStop, 
                    row['FR_dept'], row['FR_dept'], origStop, destStop, row['FR_dept']]
            row2 = [row['FR_arr'], destStop, row['dest'], row['FR_arr'], row['FR_arr']]
            
        #  Walk --> Fixed-route --> shuttle
        elif (('_FR' in row['uniqueID']) and (row['mode'] == [0,2,1])):
            FR_deptTime = get_FR_deptTime(row, busSched)
            origStop = int(str(row['FR'][0]).split('_')[0])
            destStop = int(str(row['FR'][1]).split('_')[0])
            pathDist = nx.shortest_path_length(G, source=row['orig'], target=origStop, weight='length')
            walkTime = pathDist/1.4
            arrTime = row['reqTime'] + walkTime
            row1 = [row['riderID'], row['date'], row['mode'], row['reqTime'], row['orig'], 
                    origStop, row['reqTime'],arrTime, origStop, destStop, FR_deptTime]
            
        #  Shuttle --> Fixed-route --> walk
        elif ('_FR' in row['uniqueID']):
            LM_pathDist = nx.shortest_path_length(G, source=destStop, target=row['dest'], weight='length')
            LM_walkTime = LM_pathDist/1.4
            arrTime = row['FR_arr'] + LM_walkTime
            row2 = [row['FR_arr'], row['orig'], row['dest'], row['FR_arr'], arrTime]
            
        else: # '_LM'
            row2 = [row['reqTime'], row['orig'],row['dest'],row['pickup_Sim'],row['dropoff_Sim']]    
    row = row1 + row2
    return row
        
# Wrapper to return wait times and drive times for all multimodal trips
def formatMultimodalTrips(G, data, busSched): # <--- Only consider trips with mode[1] == 2
    columns = ['riderID', 'date', 'mode','reqTime','FM_orig','FM_dest','FM_pickup','FM_dropoff',
               'FR_orig','FR_dest','FR_pickup','FR_dropoff','LM_orig','LM_dest','LM_pickup','LM_dropoff']
    df1 = pd.DataFrame(columns = columns)
    data['uniqueID_num'] = data['uniqueID'].str.split('_', expand=True)[0]
    multiModal = data[~data['uniqueID'].str.contains('Shuttle')].copy()
    i = 0
    for request in multiModal['uniqueID_num'].unique():
        filt = multiModal[multiModal['uniqueID_num'] == request].copy()
        x = formatTrips(G, filt, busSched)
        df1.loc[i] = x
        i += 1
    df1['waitTime'] = (df1['FM_pickup'] - df1['reqTime']) + \
                      (df1['FR_pickup'] - df1['FM_dropoff']) + \
                      (df1['LM_pickup'] - df1['FR_dropoff'])    
    df1['driveTime'] = (df1['FM_dropoff'] - df1['FM_pickup']) + \
                       (df1['FR_dropoff'] - df1['FR_pickup']) + \
                       (df1['LM_dropoff'] - df1['LM_pickup'])
    
    # Multi-modal dataframe
    colsToKeep2 = ['riderID', 'date', 'mode', 'reqTime','FM_orig', 'LM_dest', 'FM_pickup','LM_dropoff','waitTime','driveTime']
    multiModal = df1[colsToKeep2].copy()
    multiModal = multiModal.rename(columns={'FM_orig':'orig', 'LM_dest':'dest','FM_pickup':'pickup_Sim',
                                            'LM_dropoff':'dropoff_Sim'})
    
    # On-demand shuttle dataframe
    colsToKeep = ['riderID', 'date', 'mode', 'reqTime','orig', 'dest', 'pickup_Sim','dropoff_Sim','waitTime','driveTime']
    shuttle = data[data['uniqueID'].str.contains('Shuttle')].copy()
    shuttleDf = shuttle[colsToKeep].copy()

    # Combine data frames
    finalResults = pd.concat([shuttleDf, multiModal], axis=0).reset_index(drop=True)
    return df1, finalResults