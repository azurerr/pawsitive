﻿import { Loader } from "@googlemaps/js-api-loader";
import axios from "axios";
import React, { useEffect, useState } from "react";

const Map = (props) => {
  var permissionDenied = true;
  var permissionLat = 0;
  var permissionLng = 0;
  const tourStops = [
    // [{ lat: 34.8791806, lng: -111.8265049 }, "Boynton Pass"],
    // [{ lat: 34.8559195, lng: -111.7988186 }, "Airport Mesa"],
    // [{ lat: 34.832149, lng: -111.7695277 }, "Chapel of the Holy Cross"],
    // [{ lat: 34.823736, lng: -111.8001857 }, "Red Rock Crossing"],
    // [{ lat: 34.800326, lng: -111.7665047 }, "Bell Rock"],
  ];

  useEffect(() => {
    if (props.user != null) {
      getLocation(props.user);
      loadMap(props.user, permissionDenied);
    }
  }, [props]);

  function getLocation(users) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => showPosition(position, users),
        (error) => errorCallback(error, users)
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  function showPosition(position, users) {
    localStorage.setItem("permissionLat", position.coords.latitude);
    localStorage.setItem("permissionLng", position.coords.longitude);
    localStorage.setItem("permissionDenied", false);
    permissionLat = position.coords.latitude;
    permissionLng = position.coords.longitude;
    permissionDenied = false;
    reverseGeocoding(
      position.coords.latitude,
      position.coords.longitude,
      users
    );
  }

  function errorCallback(error, users) {
    if (error.code == error.PERMISSION_DENIED) {
      localStorage.setItem("permissionDenied", true);
      localStorage.removeItem("permissionLat");
      localStorage.removeItem("permissionLng");
      permissionDenied = true;
      loadMap(users, permissionDenied, permissionLat, permissionLng);
    } else {
      console.log(error);
    }
  }

  function reverseGeocoding(lat, lng, users) {
    var options = {
      method: "GET",
      url: "https://forward-reverse-geocoding.p.rapidapi.com/v1/reverse",
      params: {
        lat: lat,
        lon: lng,
        "accept-language": "en",
        polygon_threshold: "0.0",
      },
      headers: {
        "x-rapidapi-key": "b45077c411msh3b11fddee5a5e95p114864jsn3d68c616da31",
        "x-rapidapi-host": "forward-reverse-geocoding.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        localStorage.setItem("city", response.data.address.city.toString());
        loadMap(
          users,
          permissionDenied,
          permissionLat,
          permissionLng,
          null,
          response.data.address.city.toString()
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return (
    <div>
      <div className={props.className} id="map"></div>
      <p>
        © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{" "}
        contributors
      </p>
    </div>
  );
};

export function loadMap(
  users,
  permissionDenied,
  permissionLat,
  permissionLng,
  search,
  city
) {
  const tourStops = [];

  const loader = new Loader({
    apiKey: process.env.REACT_APP_API_KEY,
    version: "weekly",
  });

  /*var options = {
    method: "GET",
    url: "https://forward-reverse-geocoding.p.rapidapi.com/v1/forward",
    params: {
      street: "", //'12 West 4th Street',
      city: "", //'New York City',
      state: "", //'NY',
      postalcode: "", //"10012",
      country: "", //"USA",
      "accept-language": "en",
      polygon_threshold: "0.0",
    },
    headers: {
      "x-rapidapi-key": "b45077c411msh3b11fddee5a5e95p114864jsn3d68c616da31",
      "x-rapidapi-host": "forward-reverse-geocoding.p.rapidapi.com",
    },
  };*/

  var options = {
    method: "GET",
    url: "https://geocode-worldwide.p.rapidapi.com/search.php",
    params: {
      q: "", //'82 Blackthorn Dr, Vaughan, ON, Canada',
      format: "json",
      "accept-language": "en",
      limit: "5",
    },
    headers: {
      "x-rapidapi-key": "b45077c411msh3b11fddee5a5e95p114864jsn3d68c616da31",
      "x-rapidapi-host": "geocode-worldwide.p.rapidapi.com",
    },
  };

  /*options.params.address =
        user.address.streetAddress +
        ", " +
        user.address.city +
        ", " +
        user.address.province +
        ", " +
        user.address.country;*/

  if (users.length > 0) {
    if (
      localStorage.getItem("permissionDenied") != null &&
      localStorage.getItem("permissionDenied") == "false" &&
      users.find((user) =>
        localStorage.getItem("city") == null
          ? city.includes(user.address.city.toLowerCase())
          : localStorage
              .getItem("city")
              .toLocaleLowerCase()
              .includes(user.address.city.toLowerCase())
      )
    )
      users = users.filter((user) =>
        localStorage
          .getItem("city")
          .toLocaleLowerCase()
          .includes(user.address.city.toLowerCase())
      );

    users.forEach((user) => {
      /*console.log(user);
      console.log(user.address.postalCode.replace(" ", ""));
      options.params.street = user.address.streetAddress;
      options.params.city = user.address.city;
      options.params.state = user.address.province;
      options.params.country = user.address.country;*/
      options.params.q =
        user.address.streetAddress +
        ", " +
        user.address.city +
        ", " +
        user.address.province +
        ", " +
        user.address.country;

      axios
        .request(options)
        .then(function (response) {
          tourStops.push([
            {
              lat: parseFloat(response.data[0].lat), //43.65107,
              lng: parseFloat(response.data[0].lon), //-79.347015,
            },
            user.firstName + " " + user.lastName,
          ]);

          if (search == true) {
            permissionLat = tourStops[0][0].lat;
            permissionLng = tourStops[0][0].lng;
          }

          if (tourStops.length == users.length) {
            loader
              .load()
              .then(() => {
                const map = new window.google.maps.Map(
                  document.getElementById("map"),
                  {
                    center: {
                      lat:
                        !search &&
                        (localStorage.getItem("permissionDenied") == null ||
                          localStorage.getItem("permissionDenied") == "true" ||
                          permissionDenied)
                          ? 49.15675
                          : parseFloat(localStorage.getItem("permissionLat")) ||
                            permissionLat,
                      lng:
                        !search &&
                        (localStorage.getItem("permissionDenied") == null ||
                          localStorage.getItem("permissionDenied") == "true" ||
                          permissionDenied)
                          ? -84.4395
                          : parseFloat(localStorage.getItem("permissionLng")) ||
                            permissionLng,
                    }, //tourStops[0][0],
                    zoom:
                      !search &&
                      (localStorage.getItem("permissionDenied") == null ||
                        localStorage.getItem("permissionDenied") == "true" ||
                        permissionDenied)
                        ? 5
                        : 11,
                  }
                );
                tourStops.forEach(([position, title], i) => {
                  const marker = new window.google.maps.Marker({
                    position,
                    map,
                    title: `${i + 1}. ${title}`,
                    label: `${i + 1}`,
                    optimized: false,
                  });
                });
              })
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch(function (error) {
          console.error("Axios error: " + error);
        });
    });
  } else if (window.google) {
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: {
        lat: 62.24,
        lng: -96.4835,
      },
      zoom: 3.5,
    });
  }
}

export default Map;
