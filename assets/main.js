/** Redux store **/
var createStore = Redux.createStore;

const initialState = {
    VPNStatus: {
        VPN1IsUp: false,
        VPN2IsUp: false
    },
    loadBalancerIsHealthy: false
};

function status(state, action) {
    if (typeof state === 'undefined') {
        return initialState;
    }

    var newState = state;

    switch (action.type) {
        case 'VPN1_UPDATE': {
            newState.VPNStatus.VPN1IsUp = action.VPN1IsUp;
            return newState;
        }
        case 'VPN2_UPDATE': {
            newState.VPNStatus.VPN2IsUp = action.VPN2IsUp;
            return newState;
        }
        case 'LOADBALANCER_UPDATE': {
            newState.loadBalancerIsHealthy = action.loadBalancerIsHealthy;
            return newState

        }
        default: {
            return state;
        }
    }
}

var store = createStore(status);


/** API modules **/

function getData() {
    return fetch('http://ons-aws-monitoring.eu-west-1.elasticbeanstalk.com/data').then(function(result) {
        return result.json();
    }).then(function(response) {
        return response;
    }).catch(function(err) {
        console.log(err);
    });
}

function updateStore(data) {
    // Latest statuses from API
    var VPN1Status = data.VPNTunnel.Tunnel1,
        VPN2Status = data.VPNTunnel.Tunnel2,
        loadBalancerStatus = (data.LoadBalancer.Healthy > data.LoadBalancer.Unhealthy);

    // Current state statuses
    var currentState = store.getState(),
        stateVPN1Status = currentState.VPNStatus.VPN1IsUp,
        stateVPN2Status = currentState.VPNStatus.VPN2IsUp,
        stateLoadBalancerStatus = currentState.loadBalancerIsHealthy;

    // Update VPN statuses
    if (VPN1Status !== stateVPN1Status) {
        store.dispatch({
            type: 'VPN1_UPDATE',
            VPN1IsUp: VPN1Status
        });
    }
    if (VPN2Status !== stateVPN2Status) {
        store.dispatch({
            type: 'VPN2_UPDATE',
            VPN2IsUp: VPN2Status
        });
    }

    // Update Florence load balancer health
    if (loadBalancerStatus !== stateLoadBalancerStatus) {
        store.dispatch({
            type: 'LOADBALANCER_UPDATE',
            loadBalancerIsHealthy: loadBalancerStatus
        });
    }
}

getData().then(function(data) {
    updateStore(data);
    updateLastCheck();
});


/** Handle view **/

function updateLastCheck() {
    var currentDate = new Date(),
        months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        currentMonth = months[currentDate.getMonth() - 1];

    lastCheckView.innerHTML = currentDate.getDate() + " " + currentMonth + " " + currentDate.getFullYear() + " at " + currentDate.getHours() + ":" + currentDate.getMinutes() + "." + currentDate.getSeconds();
}

var latestBtn = document.getElementById('js-get-latest'),
    currentStatusView = document.getElementById('js-status'),
    lastCheckView = document.getElementById('js-last-check-date');

//Get latest data on button click
latestBtn.addEventListener('click', function() {
    getData().then(function(data) {
        updateStore(data);
        updateLastCheck();
    });
});

// Update page when store is changed
store.subscribe(function() {
    currentStatusView.innerHTML = template(store.getState());
});

// Status template
var template = function(json) {

    // Reusable tile, return negative or positive tile styling
    var tile = function (bool, innerHTML) {
        if (bool) {
            return "<div class='tile tile--positive width--9 margin-top--2 inline-block'>" + innerHTML + "</div>"
        } else {
            return "<div class='tile tile--negative width--9 margin-top--2 margin-left--1 inline-block'>" + innerHTML + "</div>"
        }
    };

    // Strings for tile text
    var vpn1status = json.VPNStatus.VPN1IsUp ? "VPN 1 is up" : "VPN 1 is down",
        vpn2status = json.VPNStatus.VPN2IsUp ? "VPN 2 is up" : "VPN 2 is down",
        loadBalancer= json.loadBalancerIsHealthy ? "Healthy" : "Unhealthy :'(";

    // Html to be updated on page
    var vpnHtml = "<h2>VPN status</h2>" + tile(json.VPNStatus.VPN1IsUp, vpn1status) + tile(json.VPNStatus.VPN2IsUp, vpn2status);
    var loadBalancerHtml = "<h2>Load balancer</h2>" + tile(json.loadBalancerIsHealthy, loadBalancer);

    return vpnHtml + loadBalancerHtml;
};
