'use strict';

/**
 * This microservice generates a thumbnail when an image is uploaded to an S3 bucket.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  11 Aug. 2015
 */

// module dependencies
var AWS = require('aws-sdk'),
    //gm = require('gm').subClass({ imageMagick: true }),
    util = require('util');

// Create a new S3 object
var s3 = new AWS.S3();

// Generate a 150x150 square image
var SIZE = 150;

/**
 * Main entrypoint of the service.
 * 
 * @param {object}  event       The data regarding the event.
 * @param {object}  context     The AWS Lambda execution context.
 */
exports.handler = function(event, context) {
    console.log(util.inspect(event, {depth: 5}));
    
    context.succeed();
};