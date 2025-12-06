# frozen_string_literal: true
# name: discourse-topic-viewers
# about: Show users who viewed a topic
# version: 0.3
# authors: Pushpender

enabled_site_setting :topic_viewers_enabled

register_asset "stylesheets/common/topic-viewers.scss"

after_initialize do
  module ::DiscourseTopicViewers
    PLUGIN_NAME = "discourse-topic-viewers"
  end

  require_dependency "application_controller"

  class ::DiscourseTopicViewers::Engine < ::Rails::Engine
    engine_name "discourse_topic_viewers"
    isolate_namespace DiscourseTopicViewers
  end

  ::DiscourseTopicViewers::Engine.routes.draw do
    get "/topic_viewers/:topic_id/:post_number" => "topic_viewers#index"
  end

  Discourse::Application.routes.append do
    mount ::DiscourseTopicViewers::Engine, at: "/"
  end
end
