var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var models = reqlib("database").models;
var moment = require("moment");
const { ObjectId } = require("mongoose").Types;
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();
const { verifyToken } = require("../../utils/jwtUtils");

const currentDirectory = __dirname;
const parentDirectory = path.resolve(currentDirectory, "..", "..");
const savePathImage = `${parentDirectory}/images`;
const savePathFile = `${parentDirectory}/files`;

const { WebSocketServer } = require("ws");
const sockserver = new WebSocketServer({ port: 443 });
const channels = new Map();

sockserver.on("connection", (ws) => {
  console.log("New client connected!");
  ws.on("close", () => {
    sockserver.clients.delete(ws);
    console.log("Client has disconnected!");
  });
  ws.on("message", async (data) => {
    data = JSON.parse(data);
    try {
      let token = data["token"];
      if (!token) {
        ws.send(
          JSON.stringify({
            code: 403,
            status: 0,
            data: null,
            message: "Please provide a token",
          })
        );

        return;
      }
      // return res.status(403).json({ error: "Please provide a token" })
      const jwt = verifyToken(token.replace("Bearer ", ""));
      data.UserID = jwt.uuid;
    } catch (e) {
      ws.send(
        JSON.stringify({
          code: 403,
          status: 0,
          data: null,
          message: "Authention fail",
        })
      );

      return;
      // return res.status(403).json({ error: "Authention fail " + e })
    }
    if (data.type === "connect") {
      sockserver.clients.forEach((client) => {
        if (client !== ws) {
          client.send(
            JSON.stringify({
              type: data.type,
              code: 200,
              status: 1,
              data: {
                UserID: data.UserID,
              },
              message: "",
            })
          );

          return;
        }
      });
    } else if (data.type === "join") {
      if (!channels.has(data.channel)) {
        channels.set(data.channel, [ws]);
      } else {
        let value = channels.get(data.channel);
        value.push(ws);
        channels.set(data.channel, value);
      }
    } else if (data.type === "message") {
      try {
        const UserID = data.UserID;
        const { FriendID, Content } = JSON.parse(data.body);
        let listImages = [];
        let listFiles = [];
        let user = await models.Users.findOne({
          _id: new ObjectId(UserID),
        }).exec();
        if (user == null) {
          ws.send(
            JSON.stringify({
              code: 400,
              status: 0,
              data: null,
              message: "User not found",
            })
          );

          return;
          // return res.status(400).json({ status: 0, data: null, message: 'User not found' })
        }

        let Friend = await models.Users.findOne({
          _id: new ObjectId(FriendID),
        }).exec();
        if (Friend == null) {
          ws.send(
            JSON.stringify({
              code: 400,
              status: 0,
              data: null,
              message: "Friend not found",
            })
          );

          return;
          // return res.status(400).json({ status: 0, data: null, message: 'Friend not found' })
        }

        data.images.forEach((file) => {
          const base64Data = file.data.replace(/^data:.+;base64,/, "");
          const extension = file.name.split(".").pop();
          const nameFile = uuidv4();

          const buffer = Buffer.from(base64Data, "base64");

          const fullPath = path.join(savePathImage, `${nameFile}.${extension}`);
          fs.writeFileSync(fullPath, buffer);
          const Link = `/images/${nameFile}.${extension}`;
          listImages.push({
            urlImage: Link,
            FileName: file.name,
          });
        });

        data.files.forEach((file) => {
          const base64Data = file.data.replace(/^data:.+;base64,/, "");
          const extension = file.name.split(".").pop();
          const nameFile = uuidv4();

          const buffer = Buffer.from(base64Data, "base64");

          const fullPath = path.join(savePathFile, `${nameFile}.${extension}`);
          fs.writeFileSync(fullPath, buffer);
          const Link = `/files/${nameFile}.${extension}`;
          listFiles.push({
            urlFile: Link,
            FileName: file.name,
          });
        });

        console.log("Files saved:", listFiles);
        console.log("Images saved:", listImages);

        // for (const file of data.files) {
        //     if (file.fieldname === 'files') {
        //         const extension = file.originalname.split('.').pop();
        //         const nameFile = uuidv4();
        //         if (!file.mimetype.startsWith('image/')) {
        //             const fullPath = path.join(savePathFile, `${nameFile}.${extension}`);
        //             fs.writeFileSync(fullPath, file.buffer);
        //             const Link = `/files/${nameFile}.${extension}`;
        //             listFiles.push({
        //                 urlFile: Link,
        //                 FileName: file.originalname
        //             })
        //         }
        //         else {
        //             const fullPath = path.join(savePathImage, `${nameFile}.${extension}`);
        //             fs.writeFileSync(fullPath, file.buffer);
        //             const Link = `/images/${nameFile}.${extension}`;
        //             listImages.push({
        //                 urlImage: Link,
        //                 FileName: file.originalname
        //             })
        //         }

        //     }
        // }

        const response = await models
          .Message({
            UserID: user._id,
            FriendID: Friend._id,
            Content: Content,
            Files: listFiles,
            Images: listImages,
            CreatedAt: moment().toDate(),
            UpdateAt: moment().toDate(),
            isSend: 0,
          })
          .save();
        await models.Users.updateOne(
          { _id: user._id },
          { UpdateAt: moment().toDate() }
        );
        const resMessage = await models.Message.find(
          { FriendID: Friend._id, isSend: 0 },
          { _id: 1, content: 1 }
        ).sort({ createdAt: 1 });
        await Promise.all(
          resMessage.map(async (value) => {
            await models.Message.updateOne({ _id: value._id }, { isSend: 1 });
          })
        );

        const channel = data.channel;
        // const clients = channels.get(channel);
        // if (clients) {
        var res = {
          type: data.type,
          code: 200,
          status: 1,
          data: {
            id: response?._id,
            channel: channel,
            UserID: UserID,
            FriendID: FriendID,
            Content: response?.Content,
            Files: response?.Files,
            Images: response?.Images,
            isSend: response?.isSend,
            CreatedAt: response?.CreatedAt,
            MessageType: 0,
          },
          message: "",
        };

        sockserver.clients.forEach((client) => {
          if (client !== ws) {
            console.log(`Distributing message: ${data}`);
            client.send(JSON.stringify(res));
          }
        });
        // }

        // return res.status(200).json({
        //     status: 1, data: {
        //         id: response?._id,
        //         Content: response?.Content,
        //         Files: response?.Files,
        //         Images: response?.Images,
        //         isSend: response?.isSend,
        //         CreatedAt: response?.CreatedAt,
        //         MessageType: 1
        //     }, message: ""
        // })
      } catch (error) {
        console.log(error);
        ws.send(
          JSON.stringify({
            code: 400,
            status: 0,
            data: null,
            message: error.message,
          })
        );
        // return res.status(400).json({ status: 0, data: null, message:  })
      }
    }
  });
  ws.onerror = function () {
    console.log("WebSocket error");
  };
});

module.exports = () => {
  router.get("/list-friend", async (req, res) => {
    try {
      const UserID = req.UserID;
      const SearchName = req.query.s;
      let user = await models.Users.findOne({ _id: new ObjectId(UserID) })
        .sort({ UpdateAt: -1 })
        .exec();
      if (user == null) {
        return res
          .status(400)
          .json({ status: 0, data: null, message: "User not found" });
      }
      let searchCriteria = { _id: { $ne: user._id } };

      if (SearchName && SearchName.trim() !== "") {
        searchCriteria.FullName = { $regex: new RegExp(SearchName, "i") };
      }

      const listUser = await models.Users.find(searchCriteria).exec();
      let listCustomFriend = [];
      await Promise.all(
        listUser.map(async (value, index) => {
          const queryConditions = [
            {
              $or: [
                { UserID: user._id, FriendID: value._id },
                { UserID: value._id, FriendID: user._id },
              ],
            },
          ];
          const response = await models.Message.find({ $and: queryConditions })
            .sort({ CreatedAt: -1 })
            .limit(1);
          listCustomFriend[index] = {
            Content: response.length > 0 ? response[0]?.Content : "",
            Files: response.length > 0 ? response[0]?.Files : null,
            Images: response.length > 0 ? response[0]?.Images : null,
            isSend: response.length > 0 ? response[0]?.isSend : 0,
            FriendID: value._id,
            FullName: value.FullName,
            Username: value.Username,
            Avatar: value.Avatar,
            isOnline: moment(value.UpdateAt).isSameOrAfter(
              moment().subtract(10, "minutes")
            ),
            MessageType:
              response.length > 0
                ? response[0]?.UserID.equals(new ObjectId(user._id))
                  ? 1
                  : 0
                : null,
          };
        })
      );
      await models.Users.updateOne(
        { _id: user._id },
        { UpdateAt: moment().toDate() }
      );
      return res
        .status(200)
        .json({ status: 1, data: listCustomFriend, message: "success" });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ status: 0, data: null, message: error.message });
    }
  });

  // router.post("/send-message", async (req, res) => {
  // try {
  //     const UserID = req.UserID
  //     const { FriendID, Content } = req.body
  //     let listImages = []
  //     let listFiles = []
  //     let user = await models.Users.findOne({ _id: new ObjectId(UserID) }).exec()
  //     if (user == null) {
  //         return res.status(400).json({ status: 0, data: null, message: 'User not found' })
  //     }
  //     let Friend = await models.Users.findOne({ _id: new ObjectId(FriendID) }).exec()
  //     if (Friend == null) {
  //         return res.status(400).json({ status: 0, data: null, message: 'Friend not found' })
  //     }
  //     for (const file of req.files) {
  //         if (file.fieldname === 'files') {
  //             const extension = file.originalname.split('.').pop();
  //             const nameFile = uuidv4();
  //             if (!file.mimetype.startsWith('image/')) {
  //                 const fullPath = path.join(savePathFile, `${nameFile}.${extension}`);
  //                 fs.writeFileSync(fullPath, file.buffer);
  //                 const Link = `/files/${nameFile}.${extension}`;
  //                 listFiles.push({
  //                     urlFile: Link,
  //                     FileName: file.originalname
  //                 })
  //             }
  //             else {
  //                 const fullPath = path.join(savePathImage, `${nameFile}.${extension}`);
  //                 fs.writeFileSync(fullPath, file.buffer);
  //                 const Link = `/images/${nameFile}.${extension}`;
  //                 listImages.push({
  //                     urlImage: Link,
  //                     FileName: file.originalname
  //                 })
  //             }
  //         }
  //     }
  //     const response = await models.Message({
  //         UserID: user._id,
  //         FriendID: Friend._id,
  //         Content: Content,
  //         Files: listFiles,
  //         Images: listImages,
  //         CreatedAt: moment().toDate(),
  //         UpdateAt: moment().toDate(),
  //         isSend: 0
  //     }).save()
  //     await models.Users.updateOne({ _id: user._id }, { UpdateAt: moment().toDate() })
  //     const resMessage = await models.Message.find({ FriendID: Friend._id, isSend: 0 }, { _id: 1, content: 1 }).sort({ createdAt: 1 });
  //     await Promise.all(resMessage.map(async (value) => {
  //         await models.Message.updateOne({ _id: value._id }, { isSend: 1 });
  //     }));
  //     return res.status(200).json({
  //         status: 1, data: {
  //             id: response?._id,
  //             Content: response?.Content,
  //             Files: response?.Files,
  //             Images: response?.Images,
  //             isSend: response?.isSend,
  //             CreatedAt: response?.CreatedAt,
  //             MessageType: 1
  //         }, message: ""
  //     })
  // } catch (error) {
  //     return res.status(400).json({ status: 0, data: null, message: error.message })
  // }
  // });

  let lastCreateDate = null;

  router.get("/get-message", async (req, res) => {
    try {
      const get_more = req.query["get-more"] === "true";
      const UserID = req.UserID;
      const { FriendID, LastTime } = req.query;
      let user = await models.Users.findOne({
        _id: new ObjectId(UserID),
      }).exec();
      if (user == null) {
        return res
          .status(400)
          .json({ status: 0, data: null, message: "User not found" });
      }

      let Friend = await models.Users.findOne({
        _id: new ObjectId(FriendID),
      }).exec();
      if (Friend == null) {
        return res
          .status(400)
          .json({ status: 0, data: null, message: "Friend not found" });
      }

      const queryConditions = [
        {
          $or: [
            { UserID: user._id, FriendID: Friend._id },
            { UserID: Friend._id, FriendID: user._id },
          ],
        },
      ];

      if (!get_more || get_more === null || get_more === undefined) {
        lastCreateDate = null;
      }

      if (lastCreateDate !== null) {
        queryConditions.push({ CreatedAt: { $lt: lastCreateDate } });
      }

      if (LastTime) {
        queryConditions.push({ CreatedAt: { $gt: LastTime } });
      }
      const response = await models.Message.find({
        $and: queryConditions,
      })
        .sort({ CreatedAt: -1 })
        .limit(20);

      if (response.length > 0) {
        lastCreateDate = response[response.length - 1].CreatedAt;
      }

      let data = [];

      await Promise.all(
        response?.map(async (value, index) => {
          if (value.UserID.equals(user._id)) {
            data[index] = {
              id: value._id,
              Content: value?.Content,
              Files: value?.Files,
              Images: value?.Images,
              isSend: value?.isSend,
              CreatedAt: value?.CreatedAt,
              MessageType: 1,
            };
          } else {
            if (value?.isSend === 0) {
              await models.Message.updateOne({ _id: value._id }, { isSend: 1 });
            }
            data[index] = {
              id: value._id,
              Avatar: Friend?.Avatar,
              Content: value?.Content,
              Files: value?.Files,
              Images: value?.Images,
              isSend: 1,
              CreatedAt: value?.CreatedAt,
              MessageType: 0,
            };
          }
        })
      );
      await models.Users.updateOne(
        { _id: user._id },
        { UpdateAt: moment().toDate() }
      );
      data.reverse();
      return res.status(200).json({ status: 1, data: data, message: "" });
    } catch (error) {
      console.error(error);
      return res
        .status(400)
        .json({ status: 0, data: null, message: error.message });
    }
  });

  return router;
};
