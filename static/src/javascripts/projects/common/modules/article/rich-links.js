define([
    'qwery',
    'common/utils/_',
    'common/utils/$',
    'common/utils/ajax',
    'common/utils/config',
    'common/utils/detect',
    'common/utils/template',

    'common/modules/article/spacefinder',
    'common/modules/ui/images',

    'text!common/views/content/richLinkTag.html'
], function (
    qwery,
    _,
    $,
    ajax,
    config,
    detect,
    template,

    spacefinder,
    imagesModule,

    richLinkTagTmpl
) {
    function upgradeRichLink(el) {
        var href = $('a', el).attr('href'),
            matches = href.match(/(?:^https?:\/\/(?:www\.|m\.code\.dev-)theguardian\.com)?(\/.*)/);

        if (matches && matches[1]) {
            ajax({
                url: '/embed/card' + matches[1] + '.json',
                crossOrigin: true
            }).then(function (resp) {
                if (resp.html) {
                    $(el).html(resp.html)
                        .removeClass('element-rich-link--not-upgraded')
                        .addClass('element-rich-link--upgraded');
                    imagesModule.upgradePictures();
                    $('.submeta-container--break').removeClass('submeta-container--break');
                }
            });
        }
    }

    function getSpacefinderRules() {
        return {
            minAbove: 200,
            minBelow: 250,
            selectors: {
                ' > h2': {minAbove: detect.getBreakpoint() === 'mobile' ? 20 : 0, minBelow: 200},
                ' > *:not(p):not(h2):not(blockquote)': {minAbove: 35, minBelow: 300},
                ' .ad-slot': {minAbove: 150, minBelow: 200},
                ' .element-rich-link': {minAbove: 500, minBelow: 500}
            }
        };
    }

    function insertTagRichLink() {
        var richLinkHrefs = $('.element-rich-link a')
                .map(function (el) { return $(el).attr('href'); }),
            testIfDuplicate = function (richLinkHref) {
                // Tag-targeted rich links can be absolute
                return _.contains(config.page.richLink, richLinkHref);
            },
            isDuplicate = richLinkHrefs.some(testIfDuplicate),
            isSensitive = config.page.shouldHideAdverts || !config.page.showRelatedContent,
            space;

        if (config.page.richLink && config.page.richLink.indexOf(config.page.pageId) === -1
            && !isSensitive && !isDuplicate) {
            space = spacefinder.getParaWithSpace(getSpacefinderRules());
            if (space) {
                $.create(template(richLinkTagTmpl, {href: config.page.richLink}))
                    .insertBefore(space)
                    .each(upgradeRichLink);
            }
        }
    }

    function upgradeRichLinks() {
        $('.element-rich-link--not-upgraded').each(upgradeRichLink);
    }

    return {
        upgradeRichLink: upgradeRichLink,
        upgradeRichLinks: upgradeRichLinks,
        insertTagRichLink: insertTagRichLink
    };
});