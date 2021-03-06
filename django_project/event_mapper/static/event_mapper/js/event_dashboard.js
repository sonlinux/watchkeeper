/**
 * Created by ismailsunni on 5/9/15.
 */

// Variables
var markers = [];
var INCIDENT_CODE = 1;
var ADVISORY_CODE = 2;

var event_layer = new L.LayerGroup();
var pie_chart;


function normalize_json_string(string){
    return string.replace(/\n/g, '<br>').slice(6, -6)
}

function create_icon(raw_event_icon){
    return L.icon({
        iconUrl: raw_event_icon,
        iconAnchor: [15, 30],
        iconSize: [30, 30]
    });
}

function create_big_icon(raw_event_icon){
    return L.icon({
        iconUrl: raw_event_icon,
        iconAnchor: [25, 50],
        iconSize: [50, 50]
    });
}

function add_event_marker(event_context){
    // Variables
    var event_icon;
    var event_marker;
    var lat = event_context['geometry']['coordinates'][1];
    var lng = event_context['geometry']['coordinates'][0];
    var event_id = event_context['properties']['id'];
    var event_place_name = event_context['properties']['place_name'];
    var event_category = event_context['properties']['category'];
    var event_date_time = event_context['properties']['date_time'];
    var event_type = event_context['properties']['type'];
    var event_perpetrator = event_context['properties']['perpetrator'];
    var event_victim = event_context['properties']['victim'];
    var event_killed = event_context['properties']['killed'];
    var event_injured = event_context['properties']['injured'];
    var event_detained = event_context['properties']['detained'];
    var event_source = event_context['properties']['source'];
    var event_notes = event_context['properties']['notes'];
    var event_reported_by = event_context['properties']['reported_by'];
    var raw_incident_icon = event_context['properties']['incident_icon'];
    var raw_advisory_icon = event_context['properties']['advisory_icon'];
    var raw_active_icon; // The icon that will be used in the dashboard

    // Draw event marker
    console.log('Adding to ' + [lat, lng]);
    if (event_category == 1){
        raw_active_icon = raw_incident_icon;
    } else if (event_category == 2) {
        raw_active_icon = raw_advisory_icon;
    }

    event_icon = create_icon(raw_active_icon);

    if (event_icon) {
        event_marker = L.marker(
            [lat, lng],
            {
                id: event_id,
                icon: event_icon,
                event_selected: false,
                event_category: event_category,
                event_place_name: event_place_name,
                event_date_time: event_date_time,
                event_type: event_type,
                event_perpetrator: event_perpetrator,
                event_victim: event_victim,
                event_killed: event_killed,
                event_injured: event_injured,
                event_detained: event_detained,
                event_source: event_source,
                event_notes: event_notes,
                event_reported_by: event_reported_by,
                event_raw_active_icon: raw_active_icon
            }
        ).addTo(map);
    }else{
        event_marker = L.marker(
            [lat, lng], {id: event_id}).addTo(map);
    }

    event_marker.on('click', on_click_marker);

    // Add to markers
    markers[event_id] = event_marker;
}

function clear_markers(){
    for(var i  = 0; i < markers.length; i++){
        if (markers[i]){
            map.removeLayer(markers[i]);
        }
    }
    markers = [];
}

function interval_changes(radio_button){
    if (radio_button.value == 'custom'){
        enable_custom_interval(true);
    } else{
        enable_custom_interval(false);
    }
}

function enable_custom_interval(show){
    var start_date_picker = $('#start_time_input');
    var end_date_picker = $('#end_time_input');
    if (show) {
        start_date_picker.parent().parent().removeClass('hidden');
        end_date_picker.parent().parent().removeClass('hidden');
    } else {
        start_date_picker.parent().parent().addClass('hidden');
        end_date_picker.parent().parent().addClass('hidden');
    }

}

function create_chart(mdata) {
    if (pie_chart){
        pie_chart.destroy();
    }
    console.log('Create chart');
    var container = $("#incident_type_chart").get(0).getContext("2d");
    var data = [
        {
            value: mdata['advisory'],
            color:"#C74444",
            highlight: "#FF5A5E",
            label: "Advisory"
        },
        {
            value: mdata['incident'],
            color: "#EDA44C",
            highlight: "#FFD39E",
            label: "Incident"
        }
    ];
    pie_chart = new Chart(container).Pie(data, {
        animateScale: true,
        animationSteps: 50,
        animationEasing: "linear"});
}

function on_click_marker(e){
    var is_selected = this.options.event_selected;
    for (var i = 0; i < markers.length; i++){
        if (markers[i]){
            set_icon(markers[i], false);
        }
    }
    if (is_selected){
        set_icon(this, false);
        show_dashboard();
    } else{
        set_icon(this, true);
        show_event_detail(this);
    }
}

function set_icon(event, selected){
    if (selected){
        var big_icon = create_big_icon(event.options.event_raw_active_icon);
        event.setIcon(big_icon)
    } else{
        var normal_icon = create_icon(event.options.event_raw_active_icon);
        event.setIcon(normal_icon)
    }
    event.options.event_selected = selected;
}

function show_event_detail(event){
    $('#event_dashboard').hide();
    $('#event_detail').show();
    if (event.options.event_category == INCIDENT_CODE){
        $('#event_detail_category').text('Incident');
    } else if (event.options.event_category == ADVISORY_CODE) {
        $('#event_detail_category').text('Advisory');
    } else{
        $('#event_detail_category').text('N/A');
    }
    $('#event_detail_place_name').text(event.options.event_place_name);
    $('#event_detail_date_time').text(event.options.event_date_time);
    $('#event_detail_type').text(event.options.event_type);
    $('#event_detail_perpetrator').text(event.options.event_perpetrator);
    $('#event_detail_victim').text(event.options.event_victim);
    $('#event_detail_killed').text(event.options.event_killed);
    $('#event_detail_injured').text(event.options.event_injured);
    $('#event_detail_detained').text(event.options.event_detained);
    $('#event_detail_source').html(normalize_json_string(event.options.event_source));
    $('#event_detail_notes').html(normalize_json_string(event.options.event_notes));
    $('#event_detail_reported_by').text(event.options.event_reported_by);

}

function show_dashboard(){
    $('#event_dashboard').show();
    $('#event_detail').hide();
}

function show_event_markers(){
    show_dashboard();
    clear_markers();
    console.log('Calling Ajax');
    var map_boundaries = map.getBounds();
    var west = map_boundaries.getWest();
    var east = map_boundaries.getEast();
    var north = wrap_number(map_boundaries.getNorth(), -90, 90);
    var south = wrap_number(map_boundaries.getSouth(), -90, 90);
    // To handle if the use zoom out, until the lng >180 or < -180
    if (west < -180){west = -180;}
    if (east > 180){east = 180;}
    var bbox = {
        'ne_lat': north,
        'ne_lng': east,
        'sw_lat': south,
        'sw_lng': west
    };
    var end_time;
    var start_time;
    var selected_time_option = $(
        'input[name="time_interval"]:checked').val();

    if (selected_time_option == '24h'){
        end_time = moment.utc();
        start_time = moment().subtract(1, 'days');
    } else if (selected_time_option == 'week'){
        end_time = moment.utc();
        start_time = moment().subtract(7, 'days');
    } else if (selected_time_option == 'custom'){
        end_time = $('#end_time_input');
        end_time = moment(end_time.val());

        start_time = $('#start_time_input');
        start_time = moment(start_time.val());
    } else{
        end_time = moment.utc();
        start_time = moment().subtract(1, 'days');
    }
    console.log(start_time);
    console.log(end_time);
    bbox = JSON.stringify(bbox);
    $.ajax({
        type: 'POST',
        url: '/show_event',
        data: {
            bbox: bbox,
            start_time: start_time.toJSON(),
            end_time: end_time.toJSON()
        },
        dataType: 'json',
        success: function(json){
            var num_incident = 0;
            var num_advisory = 0;
            console.log('Ajax success');
            var events = json['events']['features'];
            console.log('There are ' + events.length + ' events');
            for (var i = 0; i < events.length; i++){
                add_event_marker(events[i]);
                if (events[i]['properties']['category'] == INCIDENT_CODE){
                    num_incident++;
                } else if (events[i]['properties']['category'] == ADVISORY_CODE){
                    num_advisory++;
                }
            }
            $('#num_events').text(events.length);
            var num_events_events = $('#num_events_events');
            if (events.length == 1){
                num_events_events.text(' Alert');
            } else {
                num_events_events.text(' Alerts');
            }
            var side_panel = $('#side_panel');
            if (side_panel.is(":visible")) {
                // Only create chart when the side panel is visible
                create_chart(
                    {
                        advisory: num_advisory,
                        incident: num_incident
                    });
            }
        },
        errors: function(){
            console.log('Ajax failed');
        }
    })
}
