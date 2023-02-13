const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const intializingDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server has started");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};
intializingDbAndServer();

const convertDbObjectToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertmatchDetailDbObjectsToArray = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const Query = `
    SELECT 
    * 
    FROM 
    player_details;`;
  const dbResponse = await db.all(Query);
  response.send(
    dbResponse.map((eachValue) => convertDbObjectToResponse(eachValue))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT 
    *
    FROM 
    player_details
    WHERE 
     player_id=${playerId};`;
  const dbResponse = await db.get(Query);
  response.send(convertDbObjectToResponse(dbResponse));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const Query = `
    UPDATE
     player_details
    SET
     player_name= '${playerName}'
    WHERE 
     player_id=${playerId};`;
  const dbResponse = await db.run(Query);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT 
    *
    FROM
    match_details
    WHERE
     match_id=${matchId};`;
  const dbResponse = await db.get(Query);
  response.send(convertmatchDetailDbObjectsToArray(dbResponse));
});

const convertMatchDetails = (dbResponse) => {
  return {
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT 
    match_id,
    match,
    year
    FROM 
    match_details
    NATURAL JOIN
    player_match_score
    WHERE 
     player_id=${playerId};`;
  const dbRespon = await db.all(Query);
  response.send(dbRespon.map((eachValue) => convertMatchDetails(eachValue)));
});

const convertplayerDetailsToArray = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT 
    player_id,
    player_name
    FROM
    player_match_score 
    NATURAL JOIN
    player_details
    WHERE 
     match_id=${matchId};`;
  const dbRespon = await db.all(Query);
  response.send(
    dbRespon.map((eachValue) => convertplayerDetailsToArray(eachValue))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT 
    player_id,
    player_name,
    SUM(score) AS totalscore,
    SUM(fours) AS totalfours,
    SUM(sixes) AS totalsixes
    FROM
    player_details 
    NATURAL JOIN
    player_match_score
    WHERE 
     player_id=${playerId};`;
  const dbRespon = await db.get(Query);
  response.send({
    playerId: dbRespon.player_id,
    playerName: dbRespon.player_name,
    totalScore: dbRespon.totalscore,
    totalFours: dbRespon.totalfours,
    totalSixes: dbRespon.totalsixes,
  });
});
module.exports = app;
