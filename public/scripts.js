
var app = {};

app.api_base = '/api/'

var formatUrl = function (url) {
  return url.replace("http://environment.ehp.qld.gov.au/species/?op=", app.api_base);
}

var updateLocation = function(index, locationHash) {
  var path = window.location.hash.replace('#','').split('/');

  if (index === 0) {
    path[0] = locationHash;
  } else if (index === 1) {
    path[1] = locationHash;
  } else if (index === 2) {
    path[2] = locationHash;
  } else if (index === 3) {
    path[3] = locationHash;
  }

  window.location.hash = path.join('/');
}

var loadKingdoms = function($app) {
  $.getJSON(app.api_base + 'getkingdomnames', function(response) {
    var $kingdomsList = $('<ul></ul>');

    _.each(response.Kingdom, function (kingdomData) {
      var $kingdomList = $('<li data-kingdom="' + kingdomData.KingdomName + '" class="kingdom"><h3>' + kingdomData.KingdomName + (kingdomData.KingdomCommonName != undefined ? (' <small>' + kingdomData.KingdomCommonName + '</small>') : null) + '</h3></li>');

      $.getJSON('/images/' + kingdomData.KingdomName, function(imageData) {
        $kingdomList.css({
          'background-image' : 'url(' + imageData.url + ')'
        });

      });

      $kingdomList.on("click", function(e) {
        e.stopPropagation();

        updateLocation(0, kingdomData.KingdomName);

        if ($kingdomList.find('ul').length) {
          $kingdomList.find('ul').toggle();
        } else {
          $kingdomList.addClass('loading');
          loadClasses(kingdomData, $kingdomList);
        }
      });

      $kingdomsList.append($kingdomList);
    });

    $app.append($kingdomsList);

    var path = window.location.hash.replace('#','').split('/');
    if (path[0]) { $('[data-kingdom="' + path[0] + '"]').click(); }
  });
};

var loadClasses = function(kingdomData, $kingdomList) {
  $.getJSON( formatUrl(kingdomData.ClassNamesUrl), function(response) {
    var $classesList = $('<ul class="tree"></ul>');

    _.each(response.Class, function (classData) {
      var $classList = $('<li data-class="' + classData.ClassName + '" class="class"><label>' + classData.ClassName + (classData.ClassCommonName != undefined ? (' <small>' + classData.ClassCommonName + '</small>') : null) + '</label></li>');

      $.getJSON('/images/' + classData.ClassName, function(imageData) {
        $classList.append('<img src="' + imageData.url + '">')
      });

      $classList.on("click", function(e) {
        e.stopPropagation();

        updateLocation(1, classData.ClassName);

        if ($classList.find('ul').length) {
          $classList.find('ul').toggle();
        } else {
          $classList.addClass('loading');
          loadFamilies(classData, $classList);
        }
      });

      $classesList.append($classList);
    });

    $kingdomList.append($classesList).removeClass('loading');

    var path = window.location.hash.replace('#','').split('/');
    if (path[1]) { $('[data-class="' + path[1] + '"]').click(); }
  });
};


var loadFamilies = function(classData, $classList) {
  $.getJSON( formatUrl(classData.FamilyNamesUrl), function(response) {
    var $familiesList = $('<ul></ul>');

    _.each(response.Family, function (familyData) {
      var $familyList = $('<li data-family="' + familyData.FamilyName + '" class="family"><label>' + familyData.FamilyName + (familyData.FamilyCommonName != undefined ? (' <small>' + familyData.FamilyCommonName + '</small>') : null) + '</label></li>');

      $.getJSON('/images/' + familyData.FamilyName, function(imageData) {
        $familyList.append('<img src="' + imageData.url + '">')
      });

      $familyList.on("click", function(e) {
        e.stopPropagation();

        updateLocation(2, familyData.FamilyName);

        if ($familyList.find('ul').length) {
          $familyList.find('ul').toggle();
        } else {
          $familyList.addClass('loading');
          loadSpecies(familyData, $familyList);
        }
      });

      $familiesList.append($familyList).removeClass('loading');
    });

    $classList.append($familiesList).removeClass('loading');

    var path = window.location.hash.replace('#','').split('/');
    if (path[2]) { $('[data-family="' + path[2] + '"]').click(); }
  });
};


var loadSpecies = function(familyData, $familyList) {
  $.getJSON( formatUrl(familyData.SpeciesUrl), function(response) {
    var $speciesGroupList = $('<ul></ul>');

    _.each(response.Species, function (speciesData) {
      var $speciesList = $('<li class="species"><label>' + speciesData.ScientificName + (speciesData.AcceptedCommonName != undefined ? (' <small>' + speciesData.AcceptedCommonName + '</small>') : null) + '<strong class="conservation-status warning-' + speciesData.ConservationStatus.ConservationSignificant + '">' + (speciesData.ConservationStatus.BOTStatusCode != undefined ? (speciesData.ConservationStatus.BOTStatusCode + speciesData.ConservationStatus.NCAStatusCode) : '') + '</strong></label></li>');

      $speciesList.on("click", function(e) {
        e.stopPropagation();
        loadSpeciesProfile(speciesData.SpeciesProfileUrl); })

      $speciesGroupList.append($speciesList);
    });

    $familyList.append($speciesGroupList).removeClass('loading');
  });
};

var loadSpeciesProfile = function(profileUrl) {
  $.getJSON( formatUrl(profileUrl), function(response) {
    var $profile = $('<div class="profile"><button class="close-profile">Close</button></div>')

    $profile.append("<h2>" + response.Species.ScientificName + " <small>" + response.Species.AcceptedCommonName + "</small><strong class='conservation-status warning-" + response.Species.ConservationStatus.ConservationSignificant + "'>" + (response.Species.ConservationStatus.BOTStatusCode != undefined ? (response.Species.ConservationStatus.BOTStatusCode + response.Species.ConservationStatus.NCAStatusCode) : '') + "</strong></h2>");

    var $gallery = $("<div class='gallery'></div>")

    _.each(response.Species.Profile.Image, function(image) {
      $gallery.append("<div style='background-image: url(" + image.URL + ");'></div>");
    });

    $profile.append($gallery);

    $profile.find('.close-profile').on("click", function(e) {
      e.stopPropagation();
          $profile.remove()
    });

    $.getJSON( formatUrl(response.SpeciesSightingsUrl), function(geoJson) {
      if (!_.isEmpty(geoJson)) {
        $profile.append('<div id="map"></map>');

        var map = L.map('map', {
          attributionControl: false
        });

        L.tileLayer('http://{s}.tile.stamen.com/{style}/{z}/{x}/{y}.png', { style: 'toner' }).addTo(map);

        var geoJsonLayer = L.geoJson(geoJson, {
          onEachFeature: function(feature, leafletFeature) {
            if (_.any(feature.properties)) {
              html = "";
              _.each(feature.properties, function(value, key) {
                return html += "<dt>" + key + "</dt><dd>" + value + "</dd>";
              });
              leafletFeature.bindPopup("<dl>" + html + "</dl>");
            }
          }
        });

        map.addLayer(geoJsonLayer);
        map.fitBounds( geoJsonLayer.getBounds() );
      }
    });

    $('#app').append($profile);

    $profile.find('.gallery').slick();
  });
};


$(document).ready(function() {
  var $app = $('#app');
  loadKingdoms($app);
});
