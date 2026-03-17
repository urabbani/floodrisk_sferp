#!/usr/bin/env node
/**
 * Upload impact_depth_simple SLD to GeoServer exposures workspace
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exposures';
const STYLE_NAME = 'impact_depth_simple';
const SLD_FILE = './impact_depth_simple.sld';
const AUTH = Buffer.from('admin:geoserver').toString('base64');

async function uploadStyle() {
  return new Promise((resolve, reject) => {
    const sldContent = fs.readFileSync(SLD_FILE, 'utf8');

    const payload = JSON.stringify({
      style: {
        name: STYLE_NAME,
        filename: `${STYLE_NAME}.sld`,
        format: 'sld',
        languageVersion: {
          version: '1.0.0'
        },
        legend: {
          onlineResource: 'http://geoserver.org'
        }
      }
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/styles`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Style creation status: ${res.statusCode}`);
        if (res.statusCode === 201) {
          console.log('✅ Style created successfully');
          resolve(true);
        } else {
          console.log('Response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function uploadSLDBody() {
  return new Promise((resolve, reject) => {
    const sldContent = fs.readFileSync(SLD_FILE, 'utf8');

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/styles/${STYLE_NAME}.sld`,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/vnd.ogc.sld+xml',
        'Content-Length': Buffer.byteLength(sldContent),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`SLD upload status: ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SLD content uploaded successfully');
          resolve(true);
        } else {
          console.log('Response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(sldContent);
    req.end();
  });
}

async function main() {
  try {
    console.log('📤 Uploading impact_depth_simple style to exposures workspace...\n');

    // First, create the style
    const styleCreated = await uploadStyle();

    // Then upload the SLD content
    if (styleCreated) {
      await uploadSLDBody();
      console.log('\n✨ Style uploaded successfully!');
      console.log('\n🔄 Reload GeoServer to apply changes:');
      console.log('   http://10.0.0.205:8080/geoserver/web/?wicket:bookmarkable=:org.geoserver.web.GeoServerApplication:home');
    } else {
      console.log('\n⚠️  Style may already exist. Trying to update SLD content...');
      await uploadSLDBody();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
