// swift.js - Quick and dirty library for working with OpenStack Swift

// Requires
var config = require('../config/config');
var http = require('http');

module.exports = swift = {

    login: function (callback) {
        var options = {
            'host': config.swift_ip,
            'port': config.swift_port,
            'path': '/auth/v1.0',
            'headers': {
                'X-Auth-User': config.swift_user,
                'X-Auth-Key': config.swift_pass
            }
        }

        var req = http.get(options, function (res) {
            if (res.statusCode != 200) {
                callback({ 'message': 'Login failed with status code: ' + res.statusCode });
                return;
            }
            if (res.headers['x-auth-token'] == null || res.headers['x-storage-url'] == null) {
                callback({ 'message': 'Login failed without expected headers' });
                return;
            }

            config.token = res.headers['x-auth-token'];

            callback();
        });

        req.on('error', function (e) {
            callback(e);
        });
    },

    put: function (path, stream, callback) {
        var options = {
            'host': config.swift_ip,
            'port': config.swift_port,
            'path': '/v1/' + config.swift_account + '/' + path,
            'method': 'PUT',
            'headers': {
                'X-Auth-Token': config.token
            }
        }

        var req = http.request(options, function (res) {
            if (res.statusCode != 201 && res.statusCode != 202) {
                callback({ 'message': 'put failed with status code: ' + res.statusCode });
                return;
            }
            callback();
        });

        req.on('error', function (e) {
            callback(e);
        });

        // Upload content
        if (stream) { 
            stream.pipe(req); 
        }
        else {
            req.end();
        }
    },

    upload: function (container, file, stream, callback) {
        swift.put(container, null, function (e) {

            if (e) {
                callback(e);
                return;
            }

            swift.put(container + '/' + file, stream, function (f) {
                callback(f);
            });
        });
    }
};
