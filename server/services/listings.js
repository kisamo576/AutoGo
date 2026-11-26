const db = require('../db');
const { carsDatabase } = require('../../cars');

const models = new Map(carsDatabase.map(car => [car.id, car]));
const publicIdOffset = 100000;

function listingId(value) {
  const id = Number(value) - publicIdOffset;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function toListing(row) {
  const { brand, model, engine, powertrain, bodyType, drive, transmission } = models.get(row.model_id);
  return {
    id: row.id + publicIdOffset,
    model_id: row.model_id,
    brand, model, engine, powertrain, bodyType, drive, transmission,
    year: row.year,
    price: row.price,
    mileage: row.mileage,
    description: row.description,
    status: row.status,
    updated_at: row.updated_at,
    isUserListing: true
  };
}

const publicRows = db.prepare(`
  SELECT id, model_id, year, price, mileage, description, status, updated_at
  FROM listings WHERE status = 'published' ORDER BY id
`);
const knownListing = db.prepare(`
  SELECT status FROM listings WHERE id = ?
`);

function getPublishedListings() {
  return publicRows.all().map(toListing);
}

function listingExists(id, publishedOnly = false) {
  if (models.has(id)) return true;
  const row = knownListing.get(listingId(id));
  return Boolean(row && (!publishedOnly || row.status === 'published'));
}

module.exports = { models, listingId, toListing, getPublishedListings, listingExists };
