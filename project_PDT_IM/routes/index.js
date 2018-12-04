const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5433/gis';

/* GET home page. */
router.get('/', (req, res, next) => {
  res.sendFile(path.join(
    __dirname, '..', '..', 'client', 'views', 'index.html'));
});

module.exports = router;

router.get('/api/v1/geoData', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(
     'SELECT name, ST_AsGeoJSON(ST_Transform(way, 4326)), amenity, osm_id from planet_osm_point where name is not null and amenity in (\'restaurant\', \'cafe\', \'fast_food\', \'pub\')');
     // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/v2/geoData/:lat-:lng-:area', (req, res, next) => {
  const results = [];
  const lat = req.params.lat;
  const lng = req.params.lng;
  const area = req.params.area;
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(
    'SELECT name, ST_AsGeoJSON(ST_Transform(way, 4326)), amenity FROM planet_osm_point WHERE ST_DWithin(ST_Transform(way, 2163), ST_Transform(ST_SetSRID(ST_MakePoint(($1), ($2)),4326), 2163), ($3)) and name is not null and amenity in (\'restaurant\', \'cafe\', \'fast_food\', \'pub\')',[lat, lng, area]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/v3/geoData', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(
      'select name, ST_AsGeoJSON(ST_Transform(way,4326)) from planet_osm_polygon where boundary=\'administrative\' order by ST_AREA(way) desc');
     // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/v4/geoData/:region', (req, res, next) => {
  const results = [];
  const region = req.params.region;
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(
      'select r.name, ST_AsGeoJSON(ST_Transform(r.way,4326)), r.amenity from planet_osm_polygon p, planet_osm_point r where ST_Contains(p.way, r.way) and r.name is not null and r.amenity in (\'restaurant\', \'cafe\', \'fast_food\', \'pub\') and p.name = ($1)',[region]);
   // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/v5/geoData/:idA-:idB', (req, res, next) => {
  const results = [];
  const idA = req.params.idA;
  const idB = req.params.idB;
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(
    'select ST_AsGeoJSON(st_transform(ST_ClosestPoint(le.line, pe.way),4326)) as A_onLine, st_distance(le.line, pe.way) as A_toLine, ST_AsGeoJSON(st_transform(pe.way, 4326)) as A, st_length(le.line) as LineLength, ST_AsGeoJSON(st_transform(le.line, 4326)) as finalLine, le.dist as B_toLine, ST_AsGeoJSON(le.B) as B, ST_AsGeoJSON(le.PointBonLine) as B_online from (select st_transform(ST_ClosestPoint(l.way, p.way), 4326) as pointBonLine, st_transform(p.way, 4326), st_distance(l.way, p.way) as dist, l.way as line, st_transform(p.way, 4326) as b from planet_osm_point p, planet_osm_line l where p.osm_id = ($1) and st_distance(l.way, p.way) < 1000) as le, planet_osm_point pe where pe.osm_id = ($2) and st_distance(le.line, pe.way) <1000 order by st_distance(le.line, pe.way) asc, le.dist asc, le.line asc limit 5',[idB, idA]);
      // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

