
//Models
const Post = require("../../Models/TimeTable");
const moment = require("moment");
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");



// Add Post
exports.addPost = async (req, res) => {
    const { title, content, activity,child,classroom,type } = req.body;
    const {image,video} = req.files;
  
    try {
      const newPost = new Post({
        title,
        content,
        activity,
        child : child ? child : "",
        classroom : classroom ? classroom : "",
        type,
        images:image ? image.map((item) => item.filename) : "",
        videos:video ? video.map((item) => item.filename) : "",
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
  
  // Get All Posts
  exports.getAllClassPosts = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
    
        const finalAggregate = [
          { $match: { classroom: new mongoose.Types.ObjectId(req.params.classroom) } },
        ];
       
        finalAggregate.push({
          $lookup: {
            from: "classrooms",
            localField: "classroom",
            foreignField: "_id",
            as: "classroom",
          },
        }, {
          $unwind: "$classroom",
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
              { $match: { children: new mongoose.Types.ObjectId(req.params.children) } },
            ];
           
            finalAggregate.push({
              $lookup: {
                from: "childrens",
                localField: "children",
                foreignField: "_id",
                as: "children",
              },
            }, {
              $unwind: "$children",
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
      };s


  // Update Post
  exports.updatePost = async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
  
      if (!post) {
        return res.json(ApiResponse({}, "No post found", false));
      }
  
      return res.json(ApiResponse(post, "Post updated successfully", true));
    } catch (error) {
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
  