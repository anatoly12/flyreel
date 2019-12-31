const fs = require('fs');
const express = require('express');
const router = express.Router();

// write metric data to dump.json
const storeData = (data, path) => {
    try{
        fs.writeFileSync(path, JSON.stringify(data))
    } catch(err) {
        console.log(err)
    }
}

// read metric data from dump.json
const loadData = path => {
  try {
    return fs.readFileSync(path, "utf8");
  } catch (err) {
    console.error(err);
    return false;
  }
};

const path = "./dump.json";

router.get('/:metric_key/sum', function(req, res) {
    try {
          let sum = 0;
          const metricTotal = JSON.parse(loadData(path))[req.params.metric_key];
          const currentTime = Date.now();
          metricTotal.forEach(metric => {
            if (currentTime - metric.time_updated < 3600 * 1000) {
              console.log("time duration: ", currentTime - metric.time_updated);
              // calculates the sum of metric up to 1 hour
              sum += metric.metric_value;
            }
          });
          // send the response with {"value": sum}
          res.status(200).send({ value: sum });
        } catch (err) {
        console.error(err);
        // send the response with 400 error if there is no such metric
        res.status(400).send('There is no such metric');
    }
})

router.post('/:metric_key', function(req, res) {
    // check if dump.JSON is empty or doesn't exist
    if (!loadData(path)) {
        let obj = {};
        
        obj[req.params.metric_key] = [{
          time_updated: Date.now(),
          metric_value: Math.round(req.body.value)
        }];

        storeData(obj, path);
    } else {                                                    // when dump.JSON contains metric data
        let obj = JSON.parse(loadData(path));

        // check if request metric key doesn't exist
        if (obj[req.params.metric_key] == undefined) {
            obj[req.params.metric_key] = [{
                time_updated: Date.now(),
                metric_value: Math.round(req.body.value)
            }];
            storeData(obj, path);
        } else {                                                // when request metric key already exists                        
            // push a new metric object to existing metric array
            obj[req.params.metric_key].push({
              time_updated: Date.now(),
              metric_value: Math.round(req.body.value)
            });
            storeData(obj, path);
        }
    }
    // send the response with {}
    res.status(200).send({});
})

module.exports = router;