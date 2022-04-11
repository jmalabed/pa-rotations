require("dotenv").config();
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const axios = require("axios");
const parse = require("csv-parse");
const fs = require("fs");
const csv = require("csv-parser");

// global variables
const rotationArr = [
  "rot1",
  "rot2",
  "rot3",
  "rot4",
  "rot5",
  "rot6",
  "rot7",
  "rot8",
  "rot9",
  "rot10",
  "rot11",
];
let rotationList = [],
  addressObj = {},
  sortedList = [];
// read file PROMISE
const parseCSV = () => {
  let results = [];
  let addrDict = {};
  return new Promise((resolve, reject) => {
    fs.createReadStream("./Rotation_Schedule.csv")
      .pipe(csv())
      .on("data", (data) => {
        for (let i = 0; i < rotationArr.length; i++) {
          const capWords = data[rotationArr[i]].match(
            /(\b[A-Z][A-Z0-9/-]+|\b[A-Z]\b)/g
          );
          let filtAddr = filterWords(data[rotationArr[i]], capWords);
          if (
            addrDict.hasOwnProperty(filtAddr) === false &&
            filtAddr !== "- -"
          ) {
            addrDict[filtAddr] = null;
          }
          data[rotationArr[i]] = filtAddr;
          data.distance = 0;
        }
        results.push(data);
      })
      .on("end", () => {
        resolve([results, addrDict]);
        reject("error");
      });
  });
};

// filter query from CSV, clean addr before making API call
const filterWords = (str, stopArr) => {
  let words = str.split(" ");
  let res = [];
  for (let word of words) {
    if (!stopArr.includes(word)) {
      res.push(word);
    }
  }
  res = res.join(" ").trim();
  return res;
};

// query google places API! PROMISE
const makePlacesQuery = (searchString) => {
  // test query
  return new Promise((resolve, reject) => {
    client
      .textSearch({
        params: {
          query: searchString,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000, // milliseconds
      })
      .then((r) => {
        resolve(r.data.results[0].formatted_address);
        reject("error!");
      });
  });
};

// get all ADDR in async function
const getAddresses = async () => {
  //get data from csv
  try {
    const logger = await parseCSV();
    [rotationList, addressObj] = logger;
    // make query for addresses wait for data
    for (let addr in addressObj) {
      if (addr === "/ - -") continue;
      addressObj[addr] = await makePlacesQuery(addr);
    }
  } catch (e) {
    console.log(e);
  }
};

// get distances of one rotation PROMISE, addr1=[base],addr2=[others]
const makeDistanceQuery = (addr1, addr2) => {
  return new Promise((resolve, reject) => {
    client
      .distancematrix({
        params: {
          origins: addr1,
          destinations: addr2,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000,
      })
      .then((r) => {
        let rotationDist = 0;
        r.data.rows.map((row) =>
          row.elements.map((element) => {
            rotationDist += element.distance.value;
          })
        );
        resolve(rotationDist);
        reject("error");
      });
    // });
  });
};

// sample addresses
sampleAddr = {
  "Ofelia Narvasa Ofelia Narvasa Chino Hills":
    "15202 Central Ave ste b, Chino, CA 91710, United States",
  "Chi Truong Emanate Health West Covina":
    "1115 S Sunset Ave, West Covina, CA 91790, United States",
  "Michael  Jimenez Pomona Valley Hospital Medical Center Pomona":
    "1798 N Garey Ave, Pomona, CA 91767, United States",
  "M. Agron Methodist Hospital of Southern California Arcadia":
    "300 Huntington Dr, Arcadia, CA 91007, United States",
  "George  Ahad Clinic for Women Anaheim Anaheim":
    "947 S Anaheim Blvd #240, Anaheim, CA 92805, United States",
  "Bruce Albert Newport Urgent Care Newport Beach":
    "1000 Bristol St N #1b, Newport Beach, CA 92660, United States",
  "Brian  Buder Concentra/US HealthWorks-East Edinger Santa  Ana":
    "1619 E Edinger Ave, Santa Ana, CA 92705, United States",
  "Ricardo Saca Ricardo Saca, Chino":
    "5343 Riverside Dr, Chino, CA 91710, United States",
  "Luis Rivera Tustin Irvine Medical Group Irvine":
    "2220 E Fruit St #217, Santa Ana, CA 92701, United States",
};

const getDistances = async () => {
  for (let i = 0; i < rotationList.length; i++) {
    let addr2Arr = [];
    for (let j = 0; j < 11; j++) {
      if (rotationList[i][rotationArr[j]] === "- -") continue;
      else if (addressObj[rotationList[i][rotationArr[j]]] === null) continue;
      addr2Arr.push(addressObj[rotationList[i][rotationArr[j]]]);
    }
    const dist = await makeDistanceQuery(addr2Arr, addr2Arr);
    rotationList[i].distance = dist;
  }
  sortedList = rotationList.sort((a, b) => a.distance - b.distance);
  sortedList.map((ele, idx) => {
    ele.rank = idx;
  });
};

const writeToFile = (l1) => {
  fs.writeFile("./results.json", JSON.stringify(l1), () => console.log("done"));
};

// driver code
getAddresses().then(() => {
  // compare all distances and add to distance
  getDistances().then(() => {
    writeToFile(sortedList);
  });
});
