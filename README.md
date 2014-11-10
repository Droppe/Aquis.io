Aquis.io
=======

Evented I/O and data processing with Node and Redis.

##Architecture

###River
Rivers originate data from a 3rd party source and publish events on a channel.

###Aqueduct
Aqueducts shepherd data from a river input and publish events into partitioned channel.

###Pipe
Pipes create partitions and distribute data to spouts.

###Spout
Spouts receive messages for processing and publish events to a channel.


##Tweet to Thrush Flow

TweetRiver -> TweetThrushAqueduct -> TweetThrushPipe -> ThrushSpout
