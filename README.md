# Cloudboard
A private cloud that contains all your files using total.js and elastic-search.

## Releases

* [Version 2015.05](https://github.com/neonnds/Cloudboard/raw/master/cloudboard-2015-05.tar.gz)

## Getting Started

Get Cloudboard

    $> wget https://github.com/neonnds/Cloudboard/raw/master/cloudboard-2015-05.tar.gz
    
Extract Cloudboard

    $> tar -zxf cloudboard-2015-05.tar.gz
    
Enter the Cloudboard project

    $> cd ./cloudboard-2015-05

Get ElasticSearch from the offical site

    $> wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.5.0.tar.gz
    
Extract ElasticSearch

    $> tar -zxf elasticsearch-1.5.0.tar.gz
    
Start Elastic Search

    $> ./elasticsearch-1.5.0/bin/elasticsearch

Start Cloudboard

    $> nodejs index.js

Visit in a modern web browser:

    http://127.0.0.1:8000/
    

## Development

### Requirements

* [Elastic-Core](https://github.com/neonnds/Elastic-Core)

* [CUID](https://github.com/ericelliott/cuid)

* [GM](https://github.com/aheckmann/gm)

* [Graphics Magick](http://www.graphicsmagick.org/)

* [Async](https://github.com/caolan/async) 

### Linux Installation

Enter the Elastic-Core project sites directory

    $> cd ./Elastic-Core/sites

Get the Cloudboard project

    $> git clone https://github.com/neonnds/Cloudboard.git

Enter the Cloudboard project

    $> cd ./Cloudboard

Install the following node modules

    $> npm install bcrypt-nodejs --save
    
    $> npm install cuid --save
    
    $> npm install gm --save
    
    $> npm install async --save
    
    $> sudo apt-get install graphicsmagick

Enter the Elastic-Core project

    $> cd ./Elastic-Core

Start Elastic Search

    $> ./elasticsearch-1.5.0/bin/elasticsearch

Start Cloudboard

    $> ./run Cloudboard
