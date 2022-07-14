const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A post must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A post name must have less or equal then 40 characters'],
    minlength: [10, 'A post name must have more or equal then 10 characters'],
  },
  slug: {
    type: String,
  },
  category: {
    type: String,
    required: [true, 'A post must have a category'],
    enum: {
      values: ['entertainment', 'sports', 'health'],
      message: 'Category is either: entertainment, sports, health',
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Post must belong to a user.'],
  },
  description: {
    type: String,
    required: [true, 'A post must have a detail'],
    trim: true,
  },
  favourites: [],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

postSchema.index({ slug: 1 });

postSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: '-__v -passwordChangedAt',
  });

  next();
});

module.exports = mongoose.model('Post', postSchema);
