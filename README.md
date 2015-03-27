# Cloudboard
A private cloud that contains all your files using total.js and elastic-search.

## Releases

* [Version 2015.03](https://github.com/neonnds/Cloudboard/cloudboard-2015-03.tar.gz)


## Getting Started

Get ElasticSearch from the offical site

    $> wget https://github.com/neonnds/Cloudboard/cloudboard-2015-03.tar.gz
    
Extract ElasticSearch

    $> tar -zxf cloudboard-2015-03.tar.gz
    
Enter the Cloudboard project

    $> cd ./Cloudboard

Get ElasticSearch from the offical site

    $> wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.5.0.tar.gz
    
Extract ElasticSearch

    $> tar -zxf elastic-blog-2015-03.tar.gz
    
Start Elastic Search

    $> ./elasticsearch-1.5.0/bin/elasticsearch

Start Cloudboard

    $> nodejs index.js


## Development

### Requirements

* [Elastic-Core](https://github.com/neonnds/Elastic-Core)

* [CUID](https://github.com/ericelliott/cuid)

* [Textile-js](https://github.com/borgar/textile-js)


### Linux Installation

Enter the Elastic-Core project sites directory

    $> cd ./Elastic-Core/sites

Get the Elastic-Blog project

    $> git clone https://github.com/neonnds/Elastic-Blog.git

Enter the Elastic-Blog project

    $> cd ./Elastic-Blog

Get ElasticSearch from the offical site

    $> wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.5.0.tar.gz
    
Extract ElasticSearch

    $> tar -zxf elastic-blog-2015-03.tar.gz
    
Install the following node modules

    $> npm install bcrypt-nodejs --save
    
    $> npm install cuid --save
    
    $> npm install textile-js --save

Enter the Elastic-Core project

    $> cd ./Elastic-Core

Start Elastic Search

    $> ./elasticsearch-1.5.0/bin/elasticsearch

Start Elastic-Core

    $> ./run Elastic-Blog
