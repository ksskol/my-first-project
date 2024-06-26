const request = require("supertest");
const sorted = require("jest-sorted");
const app = require("../mvc/app");
const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const data = require("../db/data/test-data/index");
const endpoints = require("../endpoints.json");

afterAll(() => {
  return db.end();
});

beforeEach(() => {
  return seed(data);
});

describe("404 General Not Found Error", () => {
  test("404: When path does not exist", () => {
    return request(app)
      .get("/api/incorrect-path")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("404: Not Found");
      });
  });
});

describe("/api", () => {
  test("GET 200: Returns identical information from the endpoint's JSON", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        const { endpoints } = body;
        expect(typeof endpoints).toBe("object");
        expect(endpoints.hasOwnProperty("GET /api")).toBe(true);
        expect(endpoints.hasOwnProperty("GET /api/topics")).toBe(true);
        expect(endpoints.hasOwnProperty("GET /api/articles")).toBe(true);
      });
  });
});

describe("/api/topics", () => {
  test("GET 200: Return topics", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        expect(topics.length).toBe(3);
        topics.forEach((topic) => {
          expect(typeof topic.description).toBe("string");
          expect(typeof topic.slug).toBe("string");
        });
      });
  });
});

describe("/api/users", () => {
  test("GET 200: Return users", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        const { users } = body;

        expect(users.length).toBe(4);

        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});

describe("/api/articles", () => {
  test("GET 200: Returns an array includes all articles along with the number of comments for each", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;

        expect(articles.length).toBe(13);

        articles.forEach((article) => {
          expect(article).toMatchObject({
            author: expect.any(String),
            title: expect.any(String),
            article_id: expect.any(Number),
            topic: expect.any(String),
            created_at: expect.any(String),
            article_img_url: expect.any(String),
            votes: expect.any(Number),
            comment_count: expect.any(Number),
          });
          expect(article.body).toBeUndefined();
        });
      });
  });
  test("GET 200: Returns articles sorted by date in descending order", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("created_at", { descending: true });
      });
  });
});

describe("GET /api/articles?topic", () => {
  test("GET 200: Returns all articles by specific topic (mitch)", () => {
    return request(app)
      .get("/api/articles?topic=mitch")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;

        expect(articles.length).toBe(12);

        articles.forEach((article) => {
          expect(article.topic).toBe("mitch");
        });
      });
  });
  test('GET 200: Returns an empty array if a topic exists but there are no articles', () => {
    return request(app)
        .get('/api/articles?topic=paper')
        .expect(200)
        .then(({ body }) => {
            const { articles } = body;
            expect(articles).toEqual([]);
        });
});
  test("GET 400: Invalid topic", () => {
    return request(app)
      .get("/api/articles?topic=no")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("400: Bad Request");
      });
  });
});

describe("/api/articles/:article_id", () => {
  test("GET 200: Returns with an article object", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        });
      });
  });
  test("GET 400: Invalid id ", () => {
    return request(app)
      .get("/api/articles/two")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toEqual("400: Bad Request");
      });
  });
  test("GET 404: Valid but non-existent id", () => {
    return request(app)
      .get("/api/articles/777")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("404: Article Not Found");
      });
  });
});

describe("/api/articles/article:id with comment_count", () => {
  test("GET 200:Returns an article by article_id and adds comment_count", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
          comment_count: 11
        });
      });
  });
});

describe("/api/articles/:article_id/comments", () => {
  test("GET 200: Returns an array of all comments for the given article_id ", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;

        expect(comments.length).toBe(11);

        comments.forEach((comment) => {
          expect(comment).toMatchObject({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            article_id: 1,
          });
        });
      });
  });
  test("GET 200: Returns with an array of comments served with the most recent first", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeSortedBy("created_at", { descending: true });
      });
  });
  test("GET 200: Responds with an empty array if the article does not have any comments", () => {
    return request(app)
      .get("/api/articles/7/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toEqual([]);
      });
  });
  test("GET 400: Invalid article id", () => {
    return request(app)
      .get("/api/articles/incorrect-path/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toEqual("400: Bad Request");
      });
  });
  test("GET 404: Valid but non-existent article id", () => {
    return request(app)
      .get("/api/articles/777/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("404: Article Not Found");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("POST 201: Response with an added comment for an article", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({
        username: "icellusedkars",
        body: "Need to stay hydrated",
      })
      .expect(201)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment).toMatchObject({
          comment_id: 19,
          body: "Need to stay hydrated",
          article_id: 1,
          author: "icellusedkars",
          votes: 0,
          created_at: expect.any(String),
        });
      });
  });
  test("POST 400: Invalid id ", () => {
    return request(app)
      .post("/api/articles/two/comments")
      .send({
        username: "icellusedkars",
        body: "Need to stay hydrated",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toEqual("400: Bad Request");
      });
  });
  test("POST 404: Valid but non-existent id", () => {
    return request(app)
      .post("/api/articles/777/comments")
      .send({
        username: "icellusedkars",
        body: "Need to stay hydrated",
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("404: Article Not Found");
      });
  });
  test("POST 400: The format of the request body is incorrect", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({
        name: "icellusedkars",
        body: "Need to stay hydrated",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toEqual("400: Bad Request");
      });
  });
  test("POST 404: The username does not exist", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({
        username: "ksskol",
        body: "Need to stay hydrated",
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("404: User Not Found");
      });
  });
});

describe("PATCH 200: /api/articles/:article_id", () => {
  test("PATCH 200: Returns an updated article by article_id", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 101,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        });
      });
  });
  test("PATCH 200: (Negative numbers)  Returns an updated article by article_id if ", () => {
    return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: -99 })
        .expect(200)
        .then(({ body }) => {
            const { article } = body
            expect(article).toEqual({
                article_id: 1,
                title: 'Living in the shadow of a great man',
                topic: 'mitch',
                author: 'butter_bridge',
                body: 'I find this existence challenging',
                created_at: '2020-07-09T20:11:00.000Z',
                votes: 1,
                article_img_url: 'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700'
            });
        });
});
test('PATCH 400: Patch object is formatted incorrectly', () => {
    return request(app)
        .patch('/api/articles/3')
        .send({ notVotes: 1 })
        .expect(400)
        .then(({ body }) => {
            expect(body.msg).toBe("400: Bad Request");
        });
});

  test("PATCH 400: Invalid id ", () => {
    return request(app)
      .get("/api/articles/two")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toEqual("400: Bad Request");
      });
  });
  test("PATCH 404: Valid but non-existent id", () => {
    return request(app)
      .get("/api/articles/777")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toEqual("404: Article Not Found");
      });
  });
  test("PATCH 400: Invalid votes", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: "one" })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("400: Bad Request");
      });
  });
});

describe("DELETE 204: /api/comments/:comment_id", () => {
  test("DELETE 204: Delete the given comment by comment_id", () => {
    return request(app).delete("/api/comments/1").expect(204);
  });
  test("DELETE 400: Invalid id", () => {
    return request(app)
      .delete("/api/comments/two")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("400: Bad Request");
      });
  });
  test("DELETE 404: Valid but non-existent id", () => {
    return request(app)
      .delete("/api/comments/777")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("404: Comment Id Not Found");
      });
  });
});
