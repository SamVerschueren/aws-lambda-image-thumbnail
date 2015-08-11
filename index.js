'use strict';

/**
 * This microservice generates a thumbnail when an image is uploaded to an S3 bucket.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  11 Aug. 2015
 */

// module dependencies
var AWS = require('aws-sdk'),
    gm = require('gm').subClass({ imageMagick: true }),
    mime = require('mime'),
    util = require('util'),
    Q = require('q');

// Create a new S3 object
var s3 = new AWS.S3();

// Generate a 150x150 square image
var SIZE = 150,
    WHITELIST = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Main entrypoint of the service.
 * 
 * @param {object}  event       The data regarding the event.
 * @param {object}  context     The AWS Lambda execution context.
 */
exports.handler = function(event, context) {
    var bucket = event.Records[0].s3.bucket.name,
        source = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        
    console.log(source);
    
    Q.fcall(function() {
        // First test the image type
        var mimetype = mime.lookup(source);
        
        if(WHITELIST.indexOf(mimetype) === -1) {
            // If the mimetype is not in the whitelist, throw an error
            throw new TypeError('The type of the file is not correct.');
        }
        
        // Retrieve the object
        return getObject({Bucket: bucket, Key: source});
    }).then(function(response) {
        // Scale and crop the image
        return [response.ContentType, scale(response.Body)];
    }).spread(function(contentType, buffer) {
        var dest = source.split('/');
        dest.shift();
        dest.unshift('thumbs');
        
        var key = dest.join('/');
        
        console.log({Bucket: bucket, Key: key, Body: buffer, ContentType: contentType});
        
        // Store the image and the correct location
        return putObject({Bucket: bucket, Key: key, Body: buffer, ContentType: contentType});
    }).then(function() {
        console.log('Should be stored');
        
        // Everything went well
        context.succeed();
    }).catch(function(err) {
        console.log('Something went wrong');
        
        // Log the error
        console.error(err);
        
        // Let the function fail
        context.fail(err);  
    });
    
    function getObject(obj) {
        return Q(function(resolve, reject) {
            // Retrieve the object
            s3.getObject(obj, function(err, result) {
                if(err) {
                    // Reject because something went wrong
                    return reject(err);
                } 
                
                // We retrieved the object successfully
                resolve(result);
            });
        });
    };
    
    function putObject(obj) {
        return Q(function(resolve, reject) {
            // Retrieve the object
            s3.putObject(obj, function(err, result) {
                if(err) {
                    // Reject because something went wrong
                    return reject(err);
                }
                
                console.log('put ok');
                console.log(result);
                
                // We retrieved the object successfully
                resolve(result);
            });
        });
    };
    
    function scale(img) {
        return Q(function(resolve, reject) {
            // Retrieve the size of the img
            gm(img).size(function(err, size) {
                if(err) {
                    // Reject the promise if an error occurred
                    return reject(err);
                }
                
                // Calculate the maximum square we can extract
                var square = Math.min(size.width, size.height), 
                    x = (size.width / 2) - (square / 2),
                    y = (size.height / 2) - (square / 2);
                
                // Extract the middle square and resize to the SIZE defined
                gm(img).crop(square, square, x, y).resize(SIZE, SIZE).toBuffer(function(err, buffer) {
                    if(err) {
                        // Reject the promise if an error occurred
                        return reject(err);
                    }
                    
                    // Resolve the buffer if everything went well
                    resolve(buffer);
                });
            });
        });
    }
};