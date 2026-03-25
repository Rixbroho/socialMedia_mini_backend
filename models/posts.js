const { default: mongoose } = require("mongoose");
const mongodb = require("mongoose");

const postSchema = mongodb.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  content: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongodb.model("posts", postSchema);
