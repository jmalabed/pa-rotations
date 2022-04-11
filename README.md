# PA Rotation Distance calculator

Physician assistants typically do a 2 year program to get their masters. This consists of 1 year of in class curriculum and hands on learning.
After this year, they then go into rotations to learn about applying their skills and working with patients. Getting into different rotation tracks can be a tough choice that factors in many unfamiliar locations, care providers, and specialties.

## Goal

Make an application that finds the distance between all of the different locations that make up a rotation and helps quantify one aspect of the decision making process for PA students.

## Technology

This script utilizes the Google Maps API over Node.js. In addition, CSV parsers and JSON to CSV converters were used.

## Methods

### Background

A PA rotation usually consists of many different locations that last the course of a month. As rotation location changes, commute times and gas expenses become a burden on the student that is a - not making an income, and b - short on time to study for exams that their school still requires of them.

### Strategy

#### Preparing Data

In order to clean the data, the script first imports the rotations from CSV, and then parses it into one large array.
This was done with the node package csv-parser and the built in fs functionality that Node.js provides.

```
const fs = require("fs");
const csv = require("csv-parser");

fs.createReadStream("./Rotation_Schedule.csv")
  .pipe(csv())
  .on("data", (data) => {
    ...
```

It then applies regex to remove some extra identifiers that google will not be able to use and finds all unique listed rotations that are on the rotation board.

#### Google Maps API

The Google Maps API played a large role in this application. It allowed me to search for addresses using a text query, and search distances between several addresses with a single API call. (yay less API calls)

```
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

...
return new Promise((resolve, reject) => {
  client
    .textSearch({
      ...

...
return new Promise((resolve, reject) => {
  client
    .distancematrix({
      ...
```

#### Processing Data

The distance data found was the distance of every rotation location FROM every rotation location.
Although there is a lot of distances that would get counted multipe times, this was the fastest and easiest way to get an accurate comparison of how close all locations in a rotation were from each other, and speed was crucial for this project.
The distance data was then used as a representative number for how much potential travel one rotation was from another.
The resulting distances were then paired with their respective location and the array was sorted and ranked based on distance.

#### Sharing Results

Results of this work were exported as JSON and then converted to CSV via an online tool. (www.convertcsv.com)
The CSV was then imported to google sheets and shared with a handful of PA students to aid in their decision making.

### Learning

I had used promise functions with async/await in AJAX before, but I had never processed the results in the true spirit of a promise function, nor had I done similar using the return value of an async function.

Luckily, I got to do both in this project after a little bit of exploration.

#### Promise Functions

```
const parseCSV = () => {
  let results = [];
  let addrDict = {};
  return new Promise((resolve, reject) => {
    fs.createReadStream("./Rotation_Schedule.csv")
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
        reject("error");
      });
  });
};

```

I had used `fs.readFileSync()` before, but that function behaves synchronously.
The promise function above gave me several growing pains! Because `fs.createReadStream()` operates asynchronously, but not explicitly, I was unable to get the results that the function was designed to return, until I looked deeper at the promise function syntax.
Making `parseCSV()`, and then having that return a promise was the proper way to get the rest of my code to wait for those results in an additional async function.

```
// get all ADDR in async function
const getAddresses = async () => {
  //get data from csv
  try {
    const logger = await parseCSV();
    [rotationList, addressObj] = logger;
    ...
  } catch (e) {
    console.log(e);
  }
};
```

This strategy was also used to get my Google Maps API calls to behave nice when making several requests over different rotations.
So if anyone reads this, or if it's just for me, I'm happy to be putting these up here and understand them.

#### Digging in Github

The Google Maps API is segmented over a couple different boundaries. The first, being a client side API versus a server side API.
The next, being over different distributions and deprecations of the package.
My lack of experience, mixed with the urgency of the project, left me looking for any helpful, quick documentation or examples that I could quickly get into my script and get results.

A useful strategy that I learned, was to dig through the package and to look directly at the exported functionality instead of just looking at the README documentation. This strategy helped in several ways.

1. The method names had changed between the client side API and the node package that I was using. There was no other place for me to find these methods than here.
2. Parameters are neatly laid out and all present. It is easy to read the code because of the familiar formatting and semantic naming system. This is a very easy way to get a working function call quickly.
3. Newer functionality and flexibility that may not be well documented are all present here as well. It is more reliable to get the information from the function export itself, rather than some documentation.

#### Segmenting Code

Scripts can often be thought of as single user utility, and for that reason, can often be messy and lengthy.
However, splitting code up and then running through the functions synchronously can really tie everything together and help find where certain bugs may be propogating from. Just look at how easy it is to follow my script when I finally call my main functions.

```
// driver code
getAddresses().then(() => {
  // compare all distances and add to distance
  getDistances().then(() => {
    writeToFile(sortedList);
  });
});
```

## Conclusion

This process provided me with a lot of useful experiences that were pretty new to me, and also helped me practice accessing data in a fairly large data structure and organizing it that way.
I am leaving this up on my GitHub in hopes that I can reference it later or someone else can make use of it.
