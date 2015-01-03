var irc = require('irc');
var fs = require("fs");
var networks = [];
var clients = [];
if (fs.existsSync("./networks.json")) {
    try {
        networks = JSON.parse(fs.readFileSync("./networks.json"));
    } catch (err) {
    }
}
for (var i = 0; i < networks.length; i++) {
    addNetwork(networks[i]);
}

function addNetwork(network) {
    var name = $('<span></span>').text(network.ip).addClass("network-name");
    var edit = $('<span></span>').addClass("badge").append($("<a></a>").attr("href", "#").addClass("edit").text("Edit"));
    $('#networkList').append($('<li></li>').addClass("list-group-item").append(edit).append(name));
}

function save() {
    fs.writeFileSync("./networks.json", JSON.stringify(networks));
}

$("#networkList .create").click(function () {
    var name = "New Network";
    var modal = $('#networkModal');
    modal.find(".modal-title").text(name);
    modal.find(".network-ip").val("");
    modal.find(".network-port").val("");
    modal.find(".network-channels").empty();
    modal.modal({
        show: true
    });
    return false;
});

$(document.body).on("click", "#networkList .edit", function () {
    var name = $(this).parent().parent().find(".network-name").text();
    var network = {};
    for (var i = 0; i < networks.length; i++) {
        if (networks[i].ip == name) {
            network = networks[i];
        }
    }
    var modal = $('#networkModal');
    modal.find(".modal-title").text(name);
    modal.find(".network-ip").val(network.ip);
    modal.find(".network-port").val(network.port);
    for (i = 0; i < network.channels.length; i++) {
        var input = $("<input>").attr("type", "text").addClass("form-control").attr("placeholder", "Channel").attr("value", network.channels[i]);
        var span = $("<span></span>").addClass("input-group-btn").append($("<button></button>").attr("class", "btn btn-warning delete-channel").text("Delete"));
        modal.find(".network-channels").append($("<div></div>").addClass("input-group").addClass("input-group-sm").append(input).append(span));
    }
    modal.modal({
        show: true
    });
    return false;
});

$("#networkModal .add").click(function () {
    var input = $("<input>").attr("type", "text").addClass("form-control").attr("placeholder", "Channel");
    var span = $("<span></span>").addClass("input-group-btn").append($("<button></button>").attr("class", "btn btn-warning delete-channel").text("Delete"));
    $("#networkModal").find(".network-channels").append($("<div></div>").addClass("input-group").addClass("input-group-sm").append(input).append(span));
});

$("#networkModal .save").click(function () {
    var parent = $(this).parent().parent();
    var name = parent.find(".modal-title").text();
    var network = undefined;
    for (i = 0; i < networks.length; i++) {
        if (networks[i].ip == name) {
            network = networks[i];
            break;
        }
    }
    if (network == undefined) {
        network = {};
        networks.push(network);
    }
    network.ip = parent.find(".network-ip").val();
    network.port = parent.find(".network-port").val();
    var channels = [];
    $.each($(".network-channels").children(), function (index, child) {
        channels.push($(child).find(".form-control").val());
    });
    network.channels = channels;
    save();
    $.each($("#networkList").children(), function (index, child) {
        if (!$(child).hasClass("disabled")) {
            $(child).remove();
        }
    });
    for (var i = 0; i < networks.length; i++) {
        addNetwork(networks[i]);
    }
    $("#networkModal").modal("toggle");

});

$("#networkModal .delete").click(function () {
    var parent = $(this).parent().parent();
    var name = parent.find(".modal-title").text();
    var length = networks.length;
    while (length--) {
        if (networks[length].ip == name) {
            networks.splice(length, 1);
            break;
        }
    }
    save();
    $.each($("#networkList").children(), function (index, child) {
        if (!$(child).hasClass("disabled")) {
            $(child).remove();
        }
    });
    for (var i = 0; i < networks.length; i++) {
        addNetwork(networks[i]);
    }
    $("#networkModal").modal("toggle");
});

$(document.body).on("click", ".delete-channel", function () {
    $(this).parent().parent().remove();
});

$("#connect").click(function () {
    var nick = $("#nick").val();
    var username = $("#user").val();
    var pass = $("#pass").val();
    if (nick == "" || username == "" || pass == "") {
        $(".loginAlert").fadeIn();
    } else {
        $(".loginAlert").fadeOut();
        $(this).html('Connecting <i class="fa fa-circle-o-notch fa-spin"></i>');
        for (var i = 0; i < networks.length; i++) {
            var network = networks[i];
            var client = new irc.Client(network.ip, nick, {
                channels: network.channels,
                username: username,
                realName: username,
                port: network.port
            });
            clients.push(new Client(client, username));
        }
    }
});

var Client = function (client, username) {
    var channels = {};

    client.addListener('join', function (channel) {
        if (Object.keys(channels).length == 0) {
            $('#connector').fadeOut(function () {
                $('#content').fadeIn();
            });
        }
        channels[channel] = new Channel(channel);
    });
    client.addListener('error', function (message) {
        alert("Error: " + message.args[1]);
    });
    client.addListener('raw', function (message) {
        switch (message.rawCommand) {
            case '372':
                return;
            case 'NICK':
                username = message.args[0];
                console.log("NEW NAME: " + username);
                break;
            case 'PART':
                // someone left
                var channel = channels[message.args[0]];
                if (channel != undefined) {
                    channel.onUserLeave(message.nick);
                }
                break;
            case '353':
                // people in the room
                var channel = channels[message.args[2]];
                if (channel != undefined) {
                    channel.onUserUpdate(message.args[3].split(" "));
                }
                break;
            case 'TOPIC':
                // topic change
                channel = channels[message.args[0]];
                if (channel != undefined) {
                    channel.onTopicChange(message.args[1]);
                }
                break;
            case '332':
                // topic
                channel = channels[message.args[1]];
                if (channel != undefined) {
                    channel.onTopicChange(message.args[2]);
                }
                break;
            case 'MODE':
                // some kind of specialty message?
                if (message.args[1] == "-o") {
                    // op change
                    var nowOp = message.user.indexOf("~") != 0;
                }
                break;
            case 'PRIVMSG':
                // message
                var nick = message.nick;
                client.whois(nick, function (info) {
                    console.log("WHOIS: " + JSON.stringify(info));
                    var content = document.createElement("div");
                    content.className = "message";
                    var name = document.createElement("span");
                    name.innerText = nick;
                    name.className = "from";
                    if (info.user != undefined && info.user.indexOf("~") == 0) {
                        name.className += " op";
                    }
                    var text = document.createElement("span");
                    text.innerText = message.args[1];
                    if (text.innerText.indexOf(username) > -1) {
                        name.className += " directed";
                    }
                    content.appendChild(name);
                    content.appendChild(text);
                    document.getElementById("content").appendChild(content);
                });
                break;
        }
        console.log(JSON.stringify(message));
    });
};

var Channel = function (channel) {
    var users = [];
    this.onUserUpdate = function (newUsers) {
        users = newUsers;
        console.log("Users: " + JSON.stringify(newUsers));
    };
    this.onUserLeave = function (user) {
        var length = users.length;
        while (length--) {
            if (users[length] == user) {
                users.splice(length, 1);
                console.log("Removed user " + user);
                break;
            }
        }
    };
    this.onTopicChange = function (topic) {
        $(".alert-info").remove();
        var alert = $('<div></div>');
        alert.addClass("alert").addClass("alert-info");
        alert.text(topic);
        alert.insertBefore($('#content'));
    };
};

var User = function (nick) {
    var $this = this;
    this.requestDetails = function (client, callback) {
        client.whois(nick, function (info) {
            $this.user = info.user;
            $this.host = info.host;
            $this.channels = info.channels;
            $this.idleTime = info.idleTime;
            if (callback) {
                callback($this);
            }
        });
    };
};
