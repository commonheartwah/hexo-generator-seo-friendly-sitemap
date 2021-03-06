'use strict';

var chai = require('chai'),
  should = chai.should(),
  Hexo = require('hexo'),
  path = require('path'),
  _ = require('lodash'),
  moment = require('moment'),
  normalizeNewline = require('normalize-newline'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  helper = require('./helper'),

  readFileOptions = {
    encoding: 'utf8'
  },

  hexo = new Hexo(__dirname, {silent: true}),
  Post = hexo.model('Post'),
  Page = hexo.model('Page'),
  Tag = hexo.model('Tag'),
  generator = require(path.join(__dirname, '../lib/generator')).bind(hexo),
  photos = ['/images/img01.jpg', '/images/img02.jpg', 'http://anotherdomain/images/img03.jpg'],
  posts = [
    {source: 'foo', slug: 'foo', path: 'foo', updated: moment.utc([2015, 0, 1, 8]).toDate(), photos: photos},
    {source: 'bar', slug: 'bar', path: 'bar', updated: moment.utc([2015, 0, 2, 14]).toDate(), photos: photos},
    {source: 'baz', slug: 'baz', path: 'baz', updated: moment.utc([2015, 0, 3, 16]).toDate(), photos: photos}
  ],
  pages = [
    {source: 'Page 1', slug: 'Page 1', updated: moment.utc([2014, 11, 10, 9]).toDate(), path: 'page1'},
    {source: 'Page 2', slug: 'Page 2', updated: moment.utc([2014, 11, 15, 10]).toDate(), path: 'page2'},
    {source: 'Page 3', slug: 'Page 3', updated: moment.utc([2014, 11, 20, 11]).toDate(), path: 'page3'}
  ],
  tags = [
    {name: 'footag', path: 'footag'}
  ],
  locals,

  setPostCategories = function (post) {
    console.log('setPostCategories');
    return post.setCategories(['Cat1', 'Cat2', 'Cat3']);
  },

  setPostTags = function (post) {
    console.log('setPostTags');
    return post.setTags(['Tag1', 'Tag2', 'Tag3']);
  },

  setPostCategoriesAndTags = function (posts) {
    console.log('setPostCategoriesAndTags');
    var post = posts[0];
    return setPostCategories(post)
      .return(post)
      .then(setPostTags);
  },

  insertPosts = function () {
    console.log('insertPosts');
    return Post.insert(posts)
      .then(setPostCategoriesAndTags);
  },

  insertPages = function () {
    console.log('insertPages');
    return Page.insert(pages);
  },

  insertTags = function () {
    console.log('insertTags');
    return Tag.insert(tags);
  },
  setHexoLocals = function () {
    console.log('setHexoLocals');
    locals = hexo.locals.toObject();
    return Promise.resolve(locals);
  };

describe('SEO-friendly sitemap generator: All Sitemaps', function () {

  before(function () {
    hexo.config.permalink = ':title';
    hexo.config.root = '/';
    hexo.init();
    return insertPosts()
      .then(insertPages)
      .then(insertTags)
      .then(setHexoLocals);
  });

  it('should generate all sitemap files if posts, pages, categories and tags are defined', function () {
    hexo.config.sitemap = {
      path: 'sitemap.xml',
      beautify: false
    };

    var expectedDirectory = path.join(__dirname, 'expected'),

      expectedIndexFilePath = path.join(expectedDirectory, 'full-index-sitemap.xml'),
      expectedPostFilePath = path.join(expectedDirectory, 'full-post-sitemap.xml'),
      expectedPageFilePath = path.join(expectedDirectory, 'full-page-sitemap.xml'),
      expectedCategoryFilePath = path.join(expectedDirectory, 'full-category-sitemap.xml'),
      expectedTagFilePath = path.join(expectedDirectory, 'full-tag-sitemap.xml'),

      expectedIndexSitemap = fs.readFileAsync(expectedIndexFilePath, readFileOptions),
      expectedPostSitemap = fs.readFileAsync(expectedPostFilePath, readFileOptions),
      expectedPageSitemap = fs.readFileAsync(expectedPageFilePath, readFileOptions),
      expectedCategorySitemap = fs.readFileAsync(expectedCategoryFilePath, readFileOptions),
      expectedTagSitemap = fs.readFileAsync(expectedTagFilePath, readFileOptions),

      checkAssertions = function (result) {
        result.should.be.a('array');

        var indexSitemap = _.find(result, {path: 'sitemap.xml'}),
          postSitemap = _.find(result, {path: 'post-sitemap.xml'}),
          pageSitemap = _.find(result, {path: 'page-sitemap.xml'}),
          categorySitemap = _.find(result, {path: 'category-sitemap.xml'}),
          tagSitemap = _.find(result, {path: 'tag-sitemap.xml'});

        should.exist(indexSitemap);
        should.exist(indexSitemap.data);
        console.log(indexSitemap.data);
        should.exist(postSitemap);
        should.exist(postSitemap.data);

        should.exist(pageSitemap);
        should.exist(pageSitemap.data);

        should.exist(categorySitemap);
        should.exist(categorySitemap.data);

        should.exist(tagSitemap);
        should.exist(tagSitemap.data);

        return Promise.all([
          expectedIndexSitemap.then(function (buffer) {
            helper.removeEmptyLines(normalizeNewline(indexSitemap.data)).should.equal(helper.removeEmptyLines(normalizeNewline(buffer)));
          }),
          expectedPostSitemap.then(function (buffer) {
            helper.removeEmptyLines(normalizeNewline(postSitemap.data)).should.equal(helper.removeEmptyLines(normalizeNewline(buffer)));
          }),
          expectedPageSitemap.then(function (buffer) {
            helper.removeEmptyLines(normalizeNewline(pageSitemap.data)).should.equal(helper.removeEmptyLines(normalizeNewline(buffer)));
          }),
          expectedCategorySitemap.then(function (buffer) {
            helper.removeEmptyLines(normalizeNewline(categorySitemap.data)).should.equal(helper.removeEmptyLines(normalizeNewline(buffer)));
          }),
          expectedTagSitemap.then(function (buffer) {
            helper.removeEmptyLines(normalizeNewline(tagSitemap.data)).should.equal(helper.removeEmptyLines(normalizeNewline(buffer)));
          })
        ]);
      };

    return generator(locals)
      .then(checkAssertions);
  });
});
