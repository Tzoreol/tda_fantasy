let nfl_state = {}

const leagues_ids = {
    'league-a': '1058785148054999040',
    'league-b': '1058787235513946112',
    'league-c': '1058831407826518016',
    'league-d': '1058789814096560128'
}

let leagues_data = []
async function init() {
    const tabs = document.querySelector('md-tabs')
    let currentLeague = tabs.children.item(0).id.replace('-tab', '')
    let currentPanel = document.getElementById(`${currentLeague}-panel`)

    tabs.addEventListener('change', function(event) {
        league_to_load = tabs.activeTab.getAttribute('aria-controls').replace('-panel', '')
        loadLeagueData(league_to_load)

        currentPanel.hidden = true;
        currentPanel = document.getElementById(tabs.activeTab.getAttribute('aria-controls'))
        currentPanel.hidden = false;
    })

    for (const [league_name, league_id] of Object.entries(leagues_ids)) {
        let response = await fetch(`https://api.sleeper.app/v1/league/${league_id}`)
        leagues_data[league_name] = await response.json()
    }

    const leagues_tab = document.getElementById('leagues').children
    for(const league_tab of leagues_tab) {
        let league_name = league_tab.id.replace('-tab', '');
        document.getElementById(league_tab.id).innerHTML = leagues_data[league_name].name;
    }

    await loadNFLState()
    loadLeagueData(currentLeague)
}

async function loadLeagueData(league_name) {
    await loadLeagueRosters(league_name)
    await loadLeagueUsers(league_name)
    await loadLeagueMatchups(league_name, nfl_state.display_week)
    drawMatchups(league_name)
}

async function loadLeagueRosters(league_name) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagues_ids[league_name]}/rosters`)
    leagues_data[league_name].rosters = await response.json();
}

async function loadLeagueUsers(league_name) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagues_ids[league_name]}/users`)
    users = await response.json();

    leagues_data[league_name].users = []
    users.forEach(user => leagues_data[league_name].users[user.user_id] = user)
}

async function loadLeagueMatchups(league_name, week) {
    week = week > leagues_data[league_name].settings.leg ? leagues_data[league_name].settings.leg : week
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagues_ids[league_name]}/matchups/${week}`)
    matchups = await response.json();

    leagues_data[league_name].matchups = []
    filtered_matchups = matchups.filter(matchup => matchup.matchup_id != null)

    filtered_matchups.forEach(matchup => {
        if(!((matchup.matchup_id - 1) in leagues_data[league_name].matchups)) {
            leagues_data[league_name].matchups[matchup.matchup_id - 1] = []
        }

        leagues_data[league_name].matchups[matchup.matchup_id - 1].push(matchup)
    })
}

async function loadNFLState() {
    const response = await fetch('https://api.sleeper.app/v1/state/nfl')
    nfl_state = await response.json();
}

function drawMatchups(league_name) {
    let matchups = leagues_data[league_name].matchups
    let matchups_panel = document.getElementById(`${league_name}-matchups-panel`)

    matchups.forEach(matchup => {
        let user1_roster = leagues_data[league_name].rosters[matchup[0].roster_id - 1]
        let user1_data = leagues_data[league_name].users[user1_roster.owner_id]
        let user2_roster = leagues_data[league_name].rosters[matchup[1].roster_id - 1]
        let user2_data = leagues_data[league_name].users[user2_roster.owner_id]

        let matchup_div = document.createElement('div')
        matchup_div.setAttribute("class", "matchup")

        let user1_div = document.createElement('div')
        user1_div.setAttribute("class", "user")

        let user1_team_avatar = document.createElement('img')
        user1_team_avatar.setAttribute('src', user1_data.metadata.avatar ? user1_data.metadata.avatar : `https://sleepercdn.com/avatars/${user1_data.avatar}`)

        let user1_userinfo = document.createElement('div')
        user1_userinfo.setAttribute("class", "userinfo")
        
        let user1_username_span = document.createElement('span')
        user1_username_span.setAttribute("class", 'username')

        let user1_team_name_div = document.createElement('div')
        user1_team_name_div.setAttribute("class", 'team_name')

        let user1_score_div = document.createElement('div')
        user1_score_div.setAttribute("class", 'score')

        let user2_div = document.createElement('div')
        user2_div.setAttribute("class", "user")

        let user2_team_avatar = document.createElement('img')
        user2_team_avatar.setAttribute('src', user2_data.metadata.avatar ? user2_data.metadata.avatar : `https://sleepercdn.com/avatars/${user2_data.avatar}`)

        let user2_userinfo = document.createElement('div')
        user2_userinfo.setAttribute("class", "userinfo")

        let user2_username_span = document.createElement('span')
        user2_username_span.setAttribute("class", 'username')

        let user2_team_name_div = document.createElement('div')
        user2_team_name_div.setAttribute("class", 'team_name')

        let user2_score_div = document.createElement('div')
        user2_score_div.setAttribute("class", 'score')

        user1_username_span.innerText = user1_data.display_name
        user1_team_name_div.innerText = user1_data.metadata.team_name ? user1_data.metadata.team_name : `Team ${user1_data.display_name}`
        user1_score_div.innerText = matchup[0].points.toFixed(2)
        user1_userinfo.appendChild(user1_username_span)
        user1_userinfo.appendChild(user1_team_name_div)
        user1_div.appendChild(user1_team_avatar)
        user1_div.appendChild(user1_userinfo)
        user1_div.appendChild(user1_score_div)

        user2_username_span.innerText = user2_data.display_name
        user2_team_name_div.innerText = user2_data.metadata.team_name ? user2_data.metadata.team_name : `Team ${user2_data.display_name}`
        user2_score_div.innerText = matchup[1].points.toFixed(2)
        user2_userinfo.appendChild(user2_username_span)
        user2_userinfo.appendChild(user2_team_name_div)
        user2_div.appendChild(user2_team_avatar)
        user2_div.appendChild(user2_userinfo)
        user2_div.appendChild(user2_score_div)

        matchup_div.appendChild(user1_div)
        matchup_div.appendChild(user2_div)
        matchups_panel.appendChild(matchup_div)
    })
}
init();