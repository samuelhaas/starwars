const express = require('express');
const router = express.Router();
const BPromise = require('bluebird');
const request = BPromise.promisify(require('request'));
const _ = require('lodash');
const baseUrl = 'http://swapi.co/api';

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index.html', { title: 'Express' });
});

router.get('/characters', function(req, res) {
  getTotalCharacters([], 1)
  .then(results => {
    if (req.query.sort)
      res.render('characters.ejs', { results: sortResults(results, req.query.sort) });
    else
      res.render('characters.ejs', { results: results });

  })
});

router.get('/character/:name', function(req, res) {
  const name = req.params.name
  request({ url: `${baseUrl}/people?search=${name}`, json: true })
  .then(results => {
    res.render('characters.ejs', { results: results.body.results });
  })
})

router.get('/planetresidents', function(req, res) {
  const planets = [];
  const planetResidents = [];

  request({ url: `${baseUrl}/planets`, json: true })
  .then(results => {
    planets.push(...results.body.results);
    return getTotalCharacters([], 1);
  })
  .then(characters => {
    _.map(planets, planet => {
      let residentNames = [];
      _.map(characters, character => {
        if (character.homeworld === planet.url) {
          residentNames.push(character.name);
        }
      });

      planetResidents.push({name: planet.name, residents: residentNames});

    })

    res.render('planets.ejs', { results: planetResidents });
  })
})

function getTotalCharacters(allData, pages) {
  const options = {
    url: `${baseUrl}/people?page=${pages}`,
    json: true
  };
  return request(options)
  .then(results => allData.push(...results.body.results))
  .then(() => {
    if(_.size(allData) < 50) {
      return getTotalCharacters(allData, ++pages);
    }

    return allData;
  })

}

function sortResults(results, sortKey) {
  switch(sortKey) {
    case 'name':
      results = _.sortBy(results, ['name'],['asc']);
      break;
    case 'mass':
      results = _.sortBy(results, result => {
        return parseFloat(result.mass);
      });
      break;
    case 'height':
      results = _.sortBy(results, result => {
        return parseFloat(result.height);
      });
      break;
  }
  return results;
}

module.exports = router;
