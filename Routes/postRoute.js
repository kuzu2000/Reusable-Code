const Post = require('../Models/Post');
const { protect, role } = require('./../middleware/authmiddleware');
const router = require('express').Router();
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

router.get(
  '/trending',
  catchAsync(async (req, res, next) => {
    const trendingPost = await Post.aggregate([
      {
        $group: {
          _id: '$category',
          numCategory: { $sum: 1 },
        },
      },
      { $sort: { numCategory: 1 } },
    ]);

    res.status(200).json(trendingPost);
  })
);

router.get(
  '/',
  catchAsync(async (req, res, next) => {
    const posts = await Post.find({});
    if (posts.length === 0) {
      return next(new AppError('No posts exist', 404));
    }

    res.status(200).json(posts);
  })
);

router.get(
  '/:slug',
  catchAsync(async (req, res, next) => {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return next(new AppError('No post with that such title', 404));
    }

    res.status(200).json(post);
  })
);

router.post(
  '/create',
  protect,
  catchAsync(async (req, res, next) => {
    const newPost = await Post.create({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      author: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      newPost,
    });
  })
);

router.put(
  '/addToFavourite/:id',
  protect,
  catchAsync(async (req, res, next) => {
    const id = req.params.id;

    try {
      const post = await Post.findById(id);
      if (!post.favourites.includes(req.user.id)) {
        await Post.updateOne({ $push: { favourites: req.user.id } });
        res.status(200).json('Post Favourited');
      } else {
        await Post.updateOne({ $pull: { favourites: req.user.id } });
        res.status(200).json('Post Unfavourited');
      }
    } catch (error) {
      res.status(500).json(error);
    }
  })
);

router.post(
  '/getFavourite/:id',
  protect,
  catchAsync(async (req, res, next) => {
    const id = req.user.id
    const favourites = await Post.findById(req.params.id)
    const include = favourites.map((f) => f === id)
    if(include) {
      res.status(200).json(favourites)
    }
  })
);

router.put(
  '/update/:id',
  protect,
  catchAsync(async (req, res, next) => {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return next(new AppError('No post with this id', 404));
    }

    res.status(201).json(updatedPost);
  })
);

router.delete(
  '/delete/:id',
  protect,
  role(
    'user',
    'admin',
    catchAsync(async (req, res, next) => {
      const deletedPost = await Post.findByIdAndDelete(req.params.id);

      if (!deletedPost) {
        return next(new AppError('No post with this id', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    })
  )
);

module.exports = router;
