
var app = {};

app.api_base = '/api/'

var formatUrl = function (url) {
  return url.replace("http://environment.ehp.qld.gov.au/species/?op=", app.api_base);
}

var loadKingdoms = function($app) {
  $.getJSON(app.api_base + 'getkingdomnames', function(response) {
    var $kingdomsList = $('<ul class="tree"></ul>');

    _.each(response.Kingdom, function (kingdomData) {
      var $kingdomList = $('<li class="kingdom"><label>' + kingdomData.KingdomName + '</label> <small>' + kingdomData.KingdomCommonName + '</small></li>');

      $.getJSON('/images/' + kingdomData.KingdomName, function(imageData) {
        $kingdomList.prepend('<img src="' + imageData.url + '">')
      });

      $kingdomList.on("click", function(e) {
        e.stopPropagation();

        if ($kingdomList.find('ul').length) {
          $kingdomList.find('ul').toggle();
        } else {
          loadClasses(kingdomData, $kingdomList);
        }
      });

      $kingdomsList.append($kingdomList);
    });

    $app.append($kingdomsList);
  });
};

var loadClasses = function(kingdomData, $kingdomList) {
  $.getJSON( formatUrl(kingdomData.ClassNamesUrl), function(response) {
    var $classesList = $('<ul></ul>');

    _.each(response.Class, function (classData) {
      var $classList = $('<li class="class"><label>' + classData.ClassName + '</label> <small>' + classData.ClassCommonName + '</small></li>');

      $.getJSON('/images/' + classData.ClassName, function(imageData) {
        $classList.prepend('<img src="' + imageData.url + '">')
      });

      $classList.on("click", function(e) {
        e.stopPropagation();

        if ($classList.find('ul').length) {
          $classList.find('ul').toggle();
        } else {
          loadFamilies(classData, $classList);
        }
      });

      $classesList.append($classList);
    });

    $kingdomList.append($classesList);
  });
};


var loadFamilies = function(classData, $classList) {
  $.getJSON( formatUrl(classData.FamilyNamesUrl), function(response) {
    var $familiesList = $('<ul></ul>');

    _.each(response.Family, function (familyData) {
      var $familyList = $('<li class="family"><label>' + familyData.FamilyName + '</label> <small>' + familyData.FamilyCommonName + '</small></li>');

      $.getJSON('/images/' + familyData.FamilyName, function(imageData) {
        $familyList.prepend('<img src="' + imageData.url + '">')
      });

      $familyList.on("click", function(e) {
        e.stopPropagation();

        if ($familyList.find('ul').length) {
          $familyList.find('ul').toggle();
        } else {
          loadSpecies(familyData, $familyList);
        }
      });


      $familiesList.append($familyList);
    });

    $classList.append($familiesList)
  });
};


var loadSpecies = function(familyData, $familyList) {
  $.getJSON( formatUrl(familyData.SpeciesUrl), function(response) {
    var $speciesGroupList = $('<ul></ul>');

    _.each(response.Species, function (speciesData) {
      var $speciesList = $('<li class="species"><label>' + speciesData.ScientificName + '</label> <small>' + speciesData.AcceptedCommonName + '</small></li>');

      $speciesList.on("click", function(e) {
        e.stopPropagation();
        loadSpeciesProfile(speciesData.SpeciesProfileUrl); })

      $speciesGroupList.append($speciesList);
    });

    $familyList.append($speciesGroupList)
  });
};

var loadSpeciesProfile = function(profileUrl) {
  $.getJSON( formatUrl(profileUrl), function(response) {
    var $profile = $('<div class="profile"><button class="close-profile">Close</button></div>')

    $profile.append("<h2>" + response.Species.ScientificName + " <small>" + response.Species.AcceptedCommonName + "</small>" + "</h2>");

    var $gallery = $("<div class='gallery'></div>")

    _.each(response.Species.Profile.Image, function(image) {
      $gallery.append("<div><img src='" + image.URL + "'></div>");
    });

    $gallery.slick();

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

        var geoJsonLayer = L.geoJson(geoJson);

        map.addLayer(geoJsonLayer);
        map.fitBounds( geoJsonLayer.getBounds() );
      }
    });

    $('#app').append($profile);
  });
};


$(document).ready(function() {
  var $app = $('#app');
  loadKingdoms($app);
});
