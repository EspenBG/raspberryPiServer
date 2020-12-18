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




### Access of the sensor data
[//]: # (TODO: Wirte a breef description of how the webpage can access the stored data)


### Webpage design
[//]: # (TODO: Wirte a breef description of the webpage design)


## Communication between a unit and main server


## Server

    

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
                
                                


## Webpage


### Generate a passcode for a unit
 
Se entry [Authentication and security](#Authentication and security) for specific information.
 
