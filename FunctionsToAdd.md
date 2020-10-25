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
   

### Storing of the sensor data
[//]: # (TODO: Wirte a breef description of the database usage)


### Access of the sensor data
[//]: # (TODO: Wirte a breef description of how the webpage can access the stored data)


### Webpage design
[//]: # (TODO: Wirte a breef description of the webpage design)


## Communication between a unit and main server
The communication between a unit (ESP-32) and the main server are using socket.io. 
The first message from the unit after the connection has been established needs to be the passcode in the following format:
       
    'authentication': passcode (str)

The unit will receive the following message as replay if the passcode is correct:

    'authentication': true (bool)

And if the passcode is wrong:

    'authentication': false (bool)
    
When the unit has  been authenticated it can start transmitting sensor data to the server in the following format:

    'temperatureSensor': sensorData
    
Where sensorData is formatted in JSON and need to include the unitId as a number between 000 and 999, 
sensorId as a number between 000 and 999 and 
temperature as a number between -50 and 250 (degrees celsius). 
See the example below. (You are NOT required to include the zeroes.)

    {
    "unitId": 001,
    "sensorId": 001,
    "temperature": 25,
    }
    
    
## Server
### Configuration of units/sensors
The server-config.json in the config directory is the setup file for the server, and contains all the configuration for the sensors and what the sensors control.
There is also the user configuration in the file, this part contains all the userIds for the server and what sensors each user can monitor and control. 

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
                "unitId": "1",
                "senorId": "1",
                "temperature": "24.3",
            },
            "16035736374208": {
                 "unitId": "1",
                 "senorId": "1",
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
            
            "uniqeSensorID2": {
                    "timestamp": 5684521862,
                    "temperature": "24.3"
                },
                {
                    "timestamp": 785768767865,
                    "temperature": "25.3"
                },
                {
                    "timestamp": 344565678867823,
                    "temperature": "24.3"
                }
            }
        }
    }
                
                                

### Authentication and security
Need an ability to authenticate a user, or unit (ESP-32). This can be done by a user specific randomly generated passcode. 
For example using a 16 character long string generated by the server, and then whitelist the unit using this passcode. 
This means the first communication from a unit (ESP-32) to the server has to be the 'passcode'. Or else the server will block (blacklist) the communication from that ip. 

This is only for communication to the main server, not the webserver that is running on a different port.   

An alternative is to have one passcode per user. This can produce a security hole, unless all the "links" are secure (ssl).
## Webpage
### Generate a sensor id
There can be added a function for the user to add a new sensor configuration. There should not be the option to edit a sensor that has already implemented.
The options for adding a new sensor are:

- sensorID: This can also be generated automatically
- unitId: Can be in a dropdown list, or typed manually 
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
 