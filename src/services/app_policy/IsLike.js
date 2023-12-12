const minis_like_dislikeModel = require('../../models/minis_like_dislike.model');
const minisStatisticsModel = require('../../models/minis_statistics.model');
const usersModel = require('../../models/users.model');
const minisModel = require('../../models/minis.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const check_like = async (user, mini) => {
  const like = await minis_like_dislikeModel.findOne({
    created_by: user,
    mini: mini,
    deleted: false,
  });

  return !!like;
};
const check_user_location = async (id) => {
  const viewedByUsers = await usersModel.find({
    viewed_mini_ids: { $in: [id] },
  });
  console.log(viewedByUsers.map((uu) => uu._id));
  const locationViews = viewedByUsers.reduce(
    (acc, user) => {
      let country = 'United States';
      let city = 'California';
      if (user.address && user.address.country && user.address.city) {
        country = user.address.country.trim().toLowerCase();
        city = user.address.city.trim().toLowerCase();
      }

      const formattedCountry = country
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const formattedCity = city
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      acc.countries[formattedCountry] =
        (acc.countries[formattedCountry] || 0) + 1;
      acc.cities[formattedCity] =
        (acc.cities[formattedCity] || 0) + 1;

      return acc;
    },
    { countries: {}, cities: {} }
  );

  const formattedCountries = Object.entries(
    locationViews.countries
  ).map(([name, value]) => ({ name, value }));
  const formattedCities = Object.entries(locationViews.cities).map(
    ([name, value]) => ({ name, value })
  );

  const updates = formattedCountries.map((view) => ({
    updateOne: {
      filter: { mini: id },
      update: {
        $set: {
          countries: formattedCountries,
          cities: formattedCities,
        },
      },
      upsert: true,
    },
  }));
  await minisStatisticsModel.bulkWrite(updates);

  return { countries: formattedCountries, cities: formattedCities };
};

module.exports = {
  check_like,
  check_user_location,
};
