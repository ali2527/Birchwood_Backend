
//Models
const Post = require("../../Models/Post");
const Comment = require("../../Models/Comment");
const moment = require("moment");
const fs = require("fs")
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");
const mongoose = require('mongoose');
const { $elemMatch } = require("sift");



// Add Post
exports.addPost = async (req, res) => {
    const { content, activity,children,classroom,type } = req.body;
    const {image,video} = req.files;

    let imagesArr = image ? image.map((item) => item?.filename) : [];
    let videosArr = video ? video.map((item) => item?.filename) : [];

    console.log(req.files);  
  try {
    const newPost = new Post({
      content,
      activity,
      children: children ? JSON.parse(children) : [],
      classroom: classroom ? classroom : null,
      type,
      author: req.user._id,
      images: imagesArr,
      videos: videosArr,
    });

      await newPost.save();

      return res
        .status(201)
        .json(
          ApiResponse({ newPost }, "Post Added Successfully", true)
        );
    } catch (error) {
      return res.json(
        ApiResponse(
          {},
          errorHandler(error) ? errorHandler(error) : error.message,
          false
        )
      );
    }
  };

  exports.getAllPosts = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const userId = req.user._id;

        let finalAggregate = []
       
        if(req.query.classroom){
          finalAggregate.push({ $match: { classroom: new mongoose.Types.ObjectId(req.query.classroom) } })
        }


        if (req.query.children) {
          let childrenIds = Array.isArray(JSON.parse(req.query.children)) ? JSON.parse(req.query.children) : [JSON.parse(req.query.children)];
          // Convert children IDs to ObjectId format
          childrenIds = childrenIds.map(id => new mongoose.Types.ObjectId(id));
    
          // Match based on children array containing any of the provided student IDs
          finalAggregate.push({
            $match: { children: { $in: childrenIds } }
          });
        }


        finalAggregate.push(
          {
          $lookup: {
            from: "childrens",
            localField: "children",
            foreignField: "_id",
            as: "children",
          },
        },
                  {
          $lookup: {
            from: "classrooms",
            localField: "classroom",
            foreignField: "_id",
            as: "classroom",
          },
        }, {
          $unwind: {
            path:"$classroom",
            preserveNullAndEmptyArrays:true},
        },
        {
          $lookup: {
            from: "activities",
            localField: "activity",
            foreignField: "_id",
            as: "activity",
          },
        }, {
          $unwind: "$activity",
        },{
          $sort:{
            createdAt:-1
          }
        },{
          $addFields: {
            liked: { $in: [userId, "$likes"] },
            loved: { $in: [userId, "$loves"] },
          },
        });

      

      
        const myAggregate =
          finalAggregate.length > 0
            ? Post.aggregate(finalAggregate)
            : Post.aggregate([]);
    
            Post.aggregatePaginate(myAggregate, { page, limit }).then((posts) => {
                res.json(ApiResponse(posts));
              });
      } catch (error) {
        console.log(error)
        return res.json(ApiResponse({}, error.message, false));
      }
  };    

  
  // Get All Posts
  exports.getAllClassPosts = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
    
        const finalAggregate = [
          { $match: { classroom: new mongoose.Types.ObjectId(req.params.id) } },
        ];
       
        finalAggregate.push(
        {
          $lookup: {
            from: "activities",
            localField: "activity",
            foreignField: "_id",
            as: "activity",
          },
        }, {
          $unwind: "$activity",
        });
    
        const myAggregate =
          finalAggregate.length > 0
            ? Post.aggregate(finalAggregate)
            : Post.aggregate([]);
    
            Post.aggregatePaginate(myAggregate, { page, limit }).then((posts) => {
                res.json(ApiResponse(posts));
              });
      } catch (error) {
        return res.json(ApiResponse({}, error.message, false));
      }
  };


    // Get All Posts
    exports.getAllChildPosts = async (req, res) => {
        try {
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
        
            const finalAggregate = [
              { $match: { children: new mongoose.Types.ObjectId(req.params.id) } },
            ];
           
            finalAggregate.push(
            {
              $lookup: {
                from: "activities",
                localField: "activity",
                foreignField: "_id",
                as: "activity",
              },
            }, {
              $unwind: "$activity",
            });
        
            const myAggregate =
              finalAggregate.length > 0
                ? Post.aggregate(finalAggregate)
                : Post.aggregate([]);
        
                Post.aggregatePaginate(myAggregate, { page, limit }).then((posts) => {
                    res.json(ApiResponse(posts));
                  });
          } catch (error) {
            return res.json(ApiResponse({}, error.message, false));
          }
      };


      exports.likePost = async (req, res) => {
        const postId  = req.params.id;
        const userId = req.user._id;
      
        try {
          const post = await Post.findById(postId);
      
          if (!post) {
            return res.status(404).json(ApiResponse({}, "Post not found", false));
          }
      
          const likedIndex = post.likes.indexOf(userId);
      
          if (likedIndex !== -1) {
            post.likes.splice(likedIndex, 1); // Remove userId from likes array
          } else {
            post.likes.push(userId); // Add userId to likes array
          }
      
          await post.save();
      
          res.status(200).json(ApiResponse({}, "Post Liked Successfully", true));
        } catch (error) {
          res.status(500).json(ApiResponse({}, "Internal Server Error", false));
        }
      };
      
      exports.lovePost = async (req, res) => {
        const postId = req.params.id;
        const userId = req.user._id;
      
        try {
          const post = await Post.findById(postId);
      
          if (!post) {
            return res.status(404).json(ApiResponse({}, "Post not found", false));
          }
      
          const lovedIndex = post.loves.indexOf(userId);
      
          if (lovedIndex !== -1) {
            post.loves.splice(lovedIndex, 1); // Remove userId from loves array
          } else {
            post.loves.push(userId); // Add userId to loves array
          }
      
          await post.save();
      
          res.status(200).json(ApiResponse({}, "Post Loved Successfully", true));
        } catch (error) {
          res.status(500).json(ApiResponse({}, "Internal Server Error", false));
        }
      };
      
      exports.commentPost = async (req, res) => {
        const postId = req.params.id;
        const userId = req.user._id;
        const {content} = req.body;
      
        try {
          const post = await Post.findById(postId);
      
          if (!post) {
            return res.status(404).json(ApiResponse({}, "Post not found", false));
          }
      
          const newComment = new Comment({
            content,
            author: userId,
            post
          });

          await newComment.save();
      
          res.status(200).json(ApiResponse({newComment}, "Comment Added Successfully", true));
        } catch (error) {
          console.log(error)
          res.status(500).json(ApiResponse({}, "Internal Server Error", false));
        }
      };


      exports.getAllPostComments = async (req, res) => {
        try {
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
        
            const finalAggregate = [
              { $match: { post: new mongoose.Types.ObjectId(req.params.id) } },
            ];
           
            finalAggregate.push(
              {
                $sort: {
                  createdAt:1
                },
              });
        
            const myAggregate =
              finalAggregate.length > 0
                ? Comment.aggregate(finalAggregate)
                : Comment.aggregate([]);
        
                Comment.aggregatePaginate(myAggregate, { page, limit }).then((comments) => {
                    res.json(ApiResponse(comments));
                  });
          } catch (error) {
            return res.json(ApiResponse({}, error.message, false));
          }
      };

// Get classroom by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.json(ApiResponse({}, "Post not found", true));
    }

    return res.json(ApiResponse({ post }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

  //update post
exports.updatePost = async (req, res) => {
  try {
      let post = await Post.findById(req.params.id);

// console.log(req.body.oldImages);
// return


      let oldImages = req.body.oldImages ? JSON.parse(req.body.oldImages) : [];
      let oldVideos = req.body.oldVideos ? JSON.parse(req.body.oldVideos) : [];
      let allImages = []
      let allVideos = []
      
      
      post.content = req.body.content ? req.body.content : (post.content || "");
      post.activity = req.body.activity ? req.body.activity : (post.activity || "");
      post.children = req.body.children ?  JSON.parse(req.body.children) : (post.children || [])
      
      let temp = req?.files?.image ? req?.files?.image.map(item => item.filename) : []
      allImages = [...post.images,...temp];

      let temp2 = req?.files?.video ? req?.files?.video.map(item => item.filename) : []
      allVideos = [...post.videos,...temp2];



      
      if (oldImages && oldImages.length > 0) {

      oldImages.map(item => {
        const filePath = `./Uploads/${item}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      }
      
        post.images = allImages.filter(image => !oldImages.includes(image)) || []

        if (oldVideos && oldVideos.length > 0) {

          oldVideos.map(item => {
            const filePath = `./Uploads/${item}`;
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
          }
          
            post.videos = allVideos.filter(video => !oldVideos.includes(video)) || []


 await post.save();
    return res.json(ApiResponse(post, "Post updated successfully"));
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.json(ApiResponse({}, error.message, false));
  }
};


  
  // Delete Post
  exports.deletePost = async (req, res) => {
    try {
      const post = await Post.findByIdAndRemove(req.params.id);
  
      if (!post) {
        return res.json(ApiResponse({}, "Post not found", false));
      }
  
      return res.json(ApiResponse({}, "Post Deleted Successfully", true));
    } catch (error) {
      return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
    }
  };
  