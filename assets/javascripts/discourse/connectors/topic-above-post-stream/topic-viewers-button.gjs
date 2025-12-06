import Component from "@ember/component";
import { tagName, classNames } from "@ember-decorators/component";

@tagName("div")
@classNames("topic-above-post-stream-outlet", "topic-viewers-button")
export default class TopicViewersButton extends Component {
  <template>
    {{#if this.model}}
      <button
        class="topic-viewers-btn"
        type="button"
        data-topic-id={{this.model.id}}
        data-post-number={{this.model.postStream.firstPost?.post_number}}
      >
        Viewers
      </button>
    {{/if}}
  </template>
}

