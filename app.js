/*  

	Author: D O N   C H A T E L A I N 
	Description: League of Legends Summoner Stat Generator Test for eSports Center
	Date: April 8th, 2016

*/

var myKey = 'd8242063-343b-4154-a5db-61e11726f251';
var inputUser, userID, pulledChampStats, pulledMatches;
var region;

//============  E X E C T U T I V E S =================!====!====!====!=======

$(function() {
	$('#search').on('click', function() {
		inputUser = $('#inputuser').val();
		region = $('#region').val();
		$('#inputuser').val('');
		$('#summoner-anchor, #win-ratio-chart, #champs-anchor, #match-anchor').empty();

		// functions below handle all data sets
		getChampStats();
		getMatches();
	});
});

//=============

function getID(username, callback) {
	$.getJSON('https://' + region + '.api.pvp.net/api/lol/' + region + '/v1.4/summoner/by-name/' + username + '?api_key=' + myKey, function(data) {

		var user = Object.keys(data);
		console.log('converted ' + username + ' into ID: ' + data[user].id);
		userID = data[user].id;
		callback(userID);
	}).fail(function() {
		$('body').append('<h3>Summoner Not Found</h3>');
	});
}

//=========  Summoner Stats

function requestStats(id) { 

	console.log('BEGIN requestStats()');
	console.log('id: ', id);

	$.getJSON('https://' + region + '.api.pvp.net/api/lol/' + region + '/v1.3/stats/by-summoner/' + id + '/ranked?api_key=' + myKey, function(data) {

				pulledChampStats = data;
				// var statsToLocal = JSON.stringify(data);
				// localStorage.setItem("champStats", statsToLocal);
				// console.log('sent to local: ', data);
				printSummaryStats();
				printChampStats();
	});
}

function getChampStats() {

	var localStats = localStorage.getItem('champStats');
	if (localStats) {
		console.log('there are local stats');
		pulledChampStats = JSON.parse(localStats);
		console.log('all champ stats', pulledChampStats);
		printSummaryStats();
		printChampStats();
	} 
	else if (!localStats) {  
		console.log('no local stats');
		getID(inputUser, requestStats);
	} 
}

function printSummaryStats() {  //  NOTE: these are all RANKED STATS

	pulledChampStats.champions.sort(byID);
	var totalStats = pulledChampStats.champions[0];
	var totalWins = totalStats.stats.totalSessionsWon;
	var totalLosses = totalStats.stats.totalSessionsLost;
	var totalPlayed = totalStats.stats.totalSessionsPlayed;
	var totalWinRatio = ((totalWins / totalPlayed) * 100).toFixed(2);
	var totalKills = totalStats.stats.totalChampionKills;
	var totalAssists = totalStats.stats.totalAssists;
	var totalDeaths = totalStats.stats.totalDeathsPerSession;
	var totalKda = Math.floor(((totalKills + totalAssists) / Math.max(1, totalDeaths)) * 100) / 100; // Truncated NOT rounded !!! Will face issues if value is negative
	var totalGold = totalStats.stats.totalGoldEarned;
	var minionKills = totalStats.stats.totalMinionKills;
	var turretKills = totalStats.stats.totalTurretsKilled;

   //====================  Append Summoner Total Stats to DOM ============
	var anchor = $('#summoner-anchor');
	anchor.append('<h1 class="summoner-name">' + inputUser + '</h1>');
	anchor.append('<hr>');
	anchor.append('<h4>Summoner Statistics <span>(Current Season)</span></h4>');
	anchor.append('<p>Cumulative KDA: <strong>' + totalKda + '</strong></p>');
	anchor.append('<p>Total Gold Earned: ' + numberWithCommas(totalGold) + '</p>');
	anchor.append('<p>Total Minions Killed: ' + numberWithCommas(minionKills) + '</p>');
	anchor.append('<p>Total Turrets Killed: ' + numberWithCommas(turretKills) + '</p>');
	anchor.append('<h5>Ranked Matches</h5>');
	anchor.append('<p>Total: <strong>' + totalPlayed + '</strong></p>');
	anchor.append('<p>Wins: ' + totalWins + '</p>');
	anchor.append('<p>Losses: ' + totalLosses + '</p>');
	anchor.append('<p>Win Ratio: <strong>' + totalWinRatio + '%</strong></p>');
   //====================  WIN RATIO PIE CHART ===================
	var ctx = $('#win-ratio-chart').get(0).getContext('2d');
	var chartData = [
		{
			value: totalLosses,
			color: "#D54141",
			highlight: '#E96363',
			label: "Total Losses"
		},
		{
			value: totalWins,
			color: "#1D76A1",
			highlight: '#62869C',
			label: "Total Wins"
		}
	];
	var chartOptions = {
		segmentStrokeWidth: 5,
		animationSteps: 60,
		animationEasing: 'easeOutQuart',
		tooltipFontSize: 10,
		percentageInnerCutout: 25
	};
	var winRatioChart = new Chart(ctx).Pie(chartData, chartOptions);
}

function printChampStats() {

	var anchor = $('#champs-anchor');
	var sortedChamps = pulledChampStats.champions.sort(byBestChamps);
	var topChamps = [];

	for (var i = 1; i <= 3; i++) {
		topChamps.push(sortedChamps[i]);
	} 

	anchor.append('<h4>' + inputUser + '\'s Top 3 Champions</h4>');

	topChamps.forEach(function(champ) {
		getChampName(champ.id, function(newname) {
			anchor.append('<p class="champ-name">' + newname + '</p>');
			anchor.append('<ul>')
				.append('<li>Total Ranked Matches: ' + champ.stats.totalSessionsPlayed + '</li>')
				.append('<li>Win Rate: ' + (100 * (champ.stats.totalSessionsWon / champ.stats.totalSessionsPlayed)).toFixed(2) + '%</li>')
				.append('<li>KDA: ' + ((champ.stats.totalChampionKills + champ.stats.totalAssists) / Math.max(1, champ.stats.totalDeathsPerSession)).toFixed(2) + '</li>')
				.append('<li>Gold Earned: ' + numberWithCommas(champ.stats.totalGoldEarned) + '</li>')
				.append('<li>Minion Kills: ' + numberWithCommas(champ.stats.totalMinionKills) + '</li>')
				.append('<li>Turret Kills: ' + champ.stats.totalTurretsKilled + '</li>');
			anchor.append('</ul>');
			anchor.append('<br>');
		});
	});
}

function requestMatches(id) {

	console.log('BEGIN requestMatches()');

	$.getJSON('https://' + region + '.api.pvp.net/api/lol/' + region + '/v1.3/game/by-summoner/' + id + '/recent?api_key=d8242063-343b-4154-a5db-61e11726f251', function(data) {

		pulledMatches = data;
		// var matchesToLocal = JSON.stringify(data);
		// localStorage.setItem("recentMatches", matchesToLocal);
		// console.log('sent to local: ', data);
		printRecentMatch();
	}); 
}

function getMatches() {

	var localMatches = localStorage.getItem('recentMatches');
	if (localMatches) {
		console.log('there are local matches');
		pulledMatches = JSON.parse(localMatches);
		console.log('all recent matches data', pulledMatches);
		printRecentMatch();
	} 
	else if (!localMatches) {
		console.log('no local matches');
		getID(inputUser, requestMatches);
	}

}

function printRecentMatch() {
	
	var anchor = $('#match-anchor');
	var lastMatches = [];

	for (var i = 0; i < 3; i++) {
		lastMatches.push(pulledMatches.games[i]);
	}

	anchor.append('<h4>' + inputUser + '\'s Most Recent Matches</h4>');

	lastMatches.sort(function(a, b) {
		return b.createDate - a.createDate;
	});

	lastMatches.forEach(function(lastMatch) {

		getChampName(lastMatch.championId, function(newname) {

			var winLose;
			var matchKda = ((lastMatch.stats.championsKilled + lastMatch.stats.assists) / Math.max(1, lastMatch.stats.numDeaths)).toFixed(2);
			if (lastMatch.stats.win === true) {
				winLose = 'Win';
			} else if (lastMatch.stats.win === false) {
				winLose = 'Lose';
			}
			anchor.append('<p class="match-date">' + convertEpochToDate(lastMatch.createDate) + '</p>');
			anchor.append('<ul>')
				.append('<li>Champion: ' + newname + '</li>')
				.append('<li>Match Type: ' + lastMatch.subType.replace(/_/g, ' ') + '</li>')
				.append('<li>W/L: ' + winLose + '</li>')
				.append('<li>KDA: ' + matchKda + '</li>')
				.append('<li>Gold Earned: ' + numberWithCommas(lastMatch.stats.goldEarned) + '</li>')
				.append('<li>Minion Kills: ' + lastMatch.stats.minionsKilled + '</li>')
				.append('<li>Turret Kills: ' + lastMatch.stats.turretsKilled + '</li>');
			anchor.append('</ul>');
			anchor.append('<br>');
		});
	});
}

//=====================================  U T I L I T Y ========================
																			 //
																			//
function getChampName(id, callback) {
	$.getJSON('https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion/'+ id + '?champData=blurb&api_key=' + myKey, function(data) {

		var champName = data.name;
		callback(champName);
	});
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function convertEpochToDate(milliseconds) {
	var monthNames = [
		"Jan", "Feb", "Mar",
		"Apr", "May", "Jun", "Jul",
		"Aug", "Sep", "Oct",
		"Nov", "Dec"
	];
	var d = new Date(milliseconds);
	var month = monthNames[d.getMonth()];
	var day = d.getDate();
	var year = d.getFullYear();
	return month + ' ' + day + ', ' + year;
}

//===== Sorting =====

function byBestChamps(a, b) {
	var killA = a.stats.totalChampionKills;
	var assistA = a.stats.totalAssists;
	var deathA = a.stats.totalDeathsPerSession;
	var sessionsA = a.stats.totalSessionsPlayed;
	var calcA = ((killA + assistA) / Math.max(1, deathA)) * sessionsA;
	var killB = b.stats.totalChampionKills;
	var assistB = b.stats.totalAssists;
	var deathB = b.stats.totalDeathsPerSession;
	var sessionsB = b.stats.totalSessionsPlayed;
	var calcB = ((killB + assistB) / Math.max(1, deathB)) * sessionsB;

	return calcB - calcA;
}

function byID(a, b) {
	return a.id - b.id;
}
