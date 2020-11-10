# Functions to add to the server or webpage
## Functions made during the test project and scope of the test project
### Scope of the test project
We decided to have a test project to have a framework to build upon, and get an overview of how the project could be done.
The test project was to have a sensor connected to a unit. The unit communicated with the server, and use a simple webpage to show the value of the sensor.
There was multiple function that needed to be implemented to accomplish this goal. The functions that was needed was the following:

[//]: # (Add links to the functions to the apliccable descriptions)

- The unit needed to read the sensors value on an analog input on the controller unit.
- The measured value must be sent to the server, and stored in some way on the server.
- The webpage need to read the stored values, either send a request to the server or directly access to the data.
- The webpage needs to show the values in a simple form. This can for example be a table.

### Measure the sensor value
[//]: # (TODO: Wirte a breef description of how to mesure the sensor value)


### Communication between the unit and the main server
[//]: # (TODO: Wirte a breef description of the communication protocol)
The communication between the robot server and the robots uses socket.io. The following socket-io events need to work:

#### Sending of sensor data to server
The event to send data to the server is 'temperature', were the sensor data that is sent is packaged as a JSON string.
The following example is to send a temperature with a JS robot:

    socket.emit('temperature', '{
        "sensorID": "#####1", 
        "temperature": 23.5,
        }'
    );
     
Change #####1 and 23.5 to the values for the sensor. Were the sensorID is a unique identifier. 
The sensor identifiers use is for the server to identify and store the value of the correct sensor.


### Storing of the sensor data
[//]: # (TODO: Wirte a breef description of the database usage)

The sensor data should be stored in a local .json file, or on an external service (like Firebase). 
The structure of the database is a hierarchy were the top-level is sensorID. 
Every unique sensorID has an entry under sensorID, that stores all the sensor data. 
Every data entry contains the value of the sensor and a timestamp. See example below for the database setup. 
In the test project there will only be one sensor. 

    {
      "SensorID": {
        "#####1": [
          {
            "value": 25.2,
            "time": 3214214
          },
          {
            "value": 25.2,
            "time": 3214214
          }
        ]
      }
    }


### Access of the sensor data
[//]: # (TODO: Wirte a breef description of how the webpage can access the stored data)


### Webpage design
[//]: # (TODO: Wirte a breef description of the webpage design)


## Communication between a unit and main server
This is a brief description of the communication protocol used between units and the robot server.

The communication between a unit (ESP-32) and the main server are using socket.io. 
The first message from the unit after the connection has been established needs to be the passcode in the following format:
       
    'authentication': passcode (str)

The unit will receive the following message as replay if the passcode is correct:

    'authentication': true (bool)

And if the passcode is wrong:

    'authentication': false (bool)
    
After the unit has been authenticated it needs to send the unitID in the following format:

    "unitID": "####1"
    
The unitID do NOT need to be unique, but there may occur some problems if it is not unique. When the webserver has received and verified. 
The robot server then sends the setpoint to the unit in the following format:

    "Setpoint": setpointMessage

Setpoint is the event, and the setpointMessage is a string in JSON format, with one line per sensors, like this:

    {
        "uniqeSensorID": setpoint,
        "uniqeSensorID2": setpoint2,
    }
         
Where uniqeSensorID is replaced by the sensorID of the first sensor for the unit, and setpoint is replaced by the value of the
setpoint for that sensor. E.g. if the configuration of the unit has only one sensor,  the ID of this sensor is #####1, and 
the setpoint is 23.5 degrees the JSON message would be as follows with the event tag Setpoint:

     {"#####1": 23.5}
     

When the unit has received the setpoints it can start transmitting sensor data to the server in the following format:

    'SensorData': sensorData
    
Where sensorData is formatted in JSON and need to include the unitID as a number between 000 and 999, 
sensorID as a number between 000 and 999 and 
temperature as a number between -50 and 250 (degrees celsius). It is possible to send larger values, but the system is not designed for this.
See the example below.

    {
    "sensorID": "####1",
    "value": 25.3,
    }
    
If the sensor data is for a controlled item, e.g. heating panel or valve for air damper, you use the same event (SensorData),
and the structure of the sensorData is as follows:

    {
    "ControlledItemID": "####1",
    "value": 100,
    }

Where the ControlledItemID is the same as the ID for the sensor used to control the output. The value can ether be a binary representation (true/false)
or in percentage (0-100). 

## Server
### Configuration of units/sensors
The server-config.json in the config directory is the setup file for the server, and contains all the configuration for the sensors and what the sensors control.
There is also the user configuration in the file, this part contains all the userIDs for the server and what sensors each user can monitor and control. 

[//]: # (TODO: Fix JSON format..)

    {
        "sensor-config": {
            "uniqeSensorID": {
                    "unit": "unit1"
                    "type": "temperature",
                    "controlType": "direct",
                    "output": true,
                    "setpoint": 23.0
                },
            "uniqeSensorID2": {
                    "unit": "unit1"
                    "type": "co2",
                    "controlType": "reversed",
                    "output": true,
                    "setpoint": 23.0
                }
            }
        },
        "user-config": {
            "uniqeUserID": {              
                "sensors": {  
                    "uniqeSensorID": "AliasForSensor",
                    "uniqeSensorID2": "AliasForSensor2" 
                }                          
            },
            "uniqeUser2ID": {                           
                "sensors": {                           
                    "uniqeSensorID": "Alias2"  
                }                                                                        
            }                                          
        }
    }

    

### Saving data to Firebase
The server sends all sensor data received to the Firebase realtime database. The server adds a timestamp to the sensor data.
The structure of the database is like the example below:

    {
        "timestamps": {
            "1603573636239": {
                "unitID": "1",
                "senorID": "1",
                "temperature": "24.3",
            },
            "16035736374208": {
                 "unitID": "1",
                 "senorID": "1",
                 "temperature": "25.3",   
            }
    } 
    
    {   
        "SenorID": {
            "uniqeSensorID": {
                    "timestamp": 132321412,
                    "temperature": "24.3"
                },
                {
                    "timestamp": 43546363,
                    "temperature": "25.3"
                },
                {
                    "timestamp": 344567867823,
                    "temperature": "25.3"
                }
            },
            
            "uniqeSensorID1": {
                    "timestamp": 5684521862,
                    "temperature": "23.2"
                },
                {
                    "timestamp": 785768767865,
                    "temperature": "20"
                },
                {
                    "timestamp": 344565678867823,
                    "temperature": "95"
                }
            }
        }
    }
                
                                

### Authentication and security
Need an ability to authenticate a user, or unit (ESP-32). This can be done by a user specific randomly generated passcode. 
For example using a 16 character long string generated by the server, and then whitelist the unit using this passcode. 
This means the first communication from a unit (ESP-32) to the server has to be the 'passcode'. Or else the server will block (blacklist) the communication from that ip.
If the passcode is not used for a certain timeperiod it needs to be deleted. E.g. if the passcode has not been used for 1 week
the passcode is deleted, and the user needs to generate a new one from the webpage if the unit is going to be used again later.

This is only for communication to the robot server, not the webserver that is running on a different port.

An alternative is to have one passcode per user. This can produce a security hole, unless all the "links" are secure (ssl).
## Webpage
### Generate a sensor ID
There can be added a function for the user to add a new sensor configuration. There should not be the option to edit a sensor that has already implemented.
The options for adding a new sensor are:

- sensorID: This can also be generated automatically
- unitID: Can be in a dropdown list, or typed manually 
- type: Dropdown with the option for temperature or CO2
- monitor: when enabled the sensor is only for monitoring

If monitor is false, the following options are available:

- control type: reverse (i.e heating a room) or direct (i.e cooling a room) 
- output: true/false           
- setpoint: The setpoint for the controller

### Generate a passcode for a unit
There need to be an option to generate a new passcode for a new unit, when a user has logged in.
This can for example be a button (new unit), that when pressed asks the main server for a new passcode and displays it in a window.
 
Se entry [Authentication and security](#Authentication and security) for specific information.
 
 ### Access sensor data
 There needs to be a place to show what sensors the user has access to. The table/graph needs to be generated from a user selection 
 of sensors and timeperiod.
 
 The communication between the client and the robot server to get sensor data is in the following format:
 
    "getData", sensorSettings
    
Where getData is the event and sensorSettings is a JSON object formatted as a string. The sensorSettings can contain the 
the following settings:

- startTime: the start time in ms
- stopTime: the stop time in ms (set to 0 to get all records from start time to now)
- sensorID: the ID of the sensor or controlled item
- dataType: What to get data from (e.g. SensorID or ControlledItemID), default is SensorID

An example for the sensorSettings can be as follows:
 
            {
            "startTime": 1604669200206,
            "stopTime": 1704669200206
            "sensorID": "#####1"
            "dataType": "SensorID"
            }
            