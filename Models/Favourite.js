const mongoose = require('mongoose')

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    postId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
    },
})

favouriteSchema.pre(/^find/, function (next) {
    this.populate({
      path: 'postId',
      select: '-__v',
    });
  
    next();
  });

module.exports = mongoose.model('Favourite', favouriteSchema)