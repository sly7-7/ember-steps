import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { click, findAll, render } from '@ember/test-helpers';
import { A } from '@ember/array';

module('step-manager', function(hooks) {
  setupRenderingTest(hooks);

  module('`currentStep` attribute', function() {
    test('setting the initial visible step', async function(assert) {
      await render(hbs`
        {{#step-manager currentStep='second' as |w|}}
          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('[data-test-first]').doesNotExist();
      assert.dom('[data-test-second]').exists();
    });

    test('changes steps when the property changes', async function(assert) {
      this.set('step', 'first');
      await render(hbs`
        {{#step-manager currentStep=step as |w|}}
          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('[data-test-first]').exists();
      assert.dom('[data-test-second]').doesNotExist();

      this.set('step', 'second');

      assert.dom('[data-test-first]').doesNotExist();
      assert.dom('[data-test-second]').exists();

      // Important for binding current step to a query param
      this.set('step', undefined);

      assert.dom('[data-test-first]').exists();
      assert.dom('[data-test-second]').doesNotExist();
    });

    module('updating the target object from the component', function() {
      test("mutates the target object's property when a mutable value is provided", async function(assert) {
        this.set('step', 'first');
        await render(hbs`
          {{#step-manager currentStep=(mut step) as |w|}}
            {{w.step name='first'}}
            {{w.step name='second'}}

            <button {{action w.transition-to 'second'}}>
              Next
            </button>
          {{/step-manager}}
        `);

        await click('button');

        assert.equal(this.get('step'), 'second');
      });

      test("mutates the target object's property when a regular value is provided", async function(assert) {
        this.set('step', 'first');
        await render(hbs`
          {{#step-manager currentStep=step as |w|}}
            {{w.step name='first'}}
            {{w.step name='second'}}

            <button {{action w.transition-to 'second'}}>
              Next
            </button>
          {{/step-manager}}
        `);

        await click('button');

        assert.equal(this.get('step'), 'second');
      });

      test('does not update the target object with an unbound value', async function(assert) {
        this.set('step', 'first');
        await render(hbs`
          {{#step-manager currentStep=(unbound step) as |w|}}
            {{w.step name='first'}}
            {{w.step name='second'}}

            <button {{action w.transition-to 'second'}}>
              Next
            </button>
          {{/step-manager}}
        `);

        await click('button');

        assert.equal(this.get('step'), 'first');
      });
    });
  });

  module('`initialStep` attribute', function() {
    test('it can set the initial visible step', async function(assert) {
      await render(hbs`
        {{#step-manager initialStep='second' as |w|}}
          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('[data-test-first]').doesNotExist();
      assert.dom('[data-test-second]').exists();
    });

    test('it does not update the value as the step changes', async function(assert) {
      this.set('initialStep', 'second');
      await render(hbs`
        {{#step-manager initialStep=initialStep as |w|}}
          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}

          <button {{action w.transition-to 'first'}}>
            To First
          </button>
        {{/step-manager}}
      `);

      await click('button');

      assert.dom('[data-test-first]').exists();
      assert.equal(this.get('initialStep'), 'second');
    });
  });

  test('renders the first step in the DOM if no `currentStep` is present', async function(assert) {
    await render(hbs`
      {{#step-manager as |w|}}
        {{#w.step name='first'}}
          <div data-test-first></div>
        {{/w.step}}

        {{#w.step name='second'}}
          <div data-test-second></div>
        {{/w.step}}
      {{/step-manager}}
    `);

    assert.dom('[data-test-first]').exists();
    assert.dom('[data-test-second]').doesNotExist();
  });

  test('renders tagless components', async function(assert) {
    await render(hbs`
      <div id="steps">
        {{#step-manager as |w|}}
          {{w.step}}
        {{/step-manager}}
      </div>
    `);

    assert.equal(findAll('#steps *').length, 0);
  });

  module('`yield`-ed data', function() {
    test('exposes the name of the current step', async function(assert) {
      await render(hbs`
        {{#step-manager as |w|}}
          <div data-test-steps>
            {{w.currentStep}}

            {{w.step name='foo'}}
          </div>
        {{/step-manager}}
      `);

      assert.dom('[data-test-steps]').hasText('foo');
    });

    module('exposing an array of steps', function() {
      test('can render the array after the steps are defined', async function(assert) {
        await render(hbs`
          {{#step-manager as |w|}}
            <div data-test-active-step>
              {{#w.step name='foo'}}
                Foo
              {{/w.step}}

              {{#w.step name='bar'}}
                Bar
              {{/w.step}}
            </div>

            {{#each w.steps as |step|}}
              <a {{action w.transition-to step}} data-test-step-trigger={{step}}>
                {{step}}
              </a>
            {{/each}}
          {{/step-manager}}
        `);

        assert.dom('[data-test-step-trigger]').exists({ count: 2 });
        assert.dom('[data-test-step-trigger="foo"]').hasText('foo');
        assert.dom('[data-test-step-trigger="bar"]').hasText('bar');

        assert.dom('[data-test-active-step]').hasText('Foo');

        await click('[data-test-step-trigger="bar"]');

        assert.dom('[data-test-active-step]').hasText('Bar');
      });

      test('can render the array before the steps are defined', async function(assert) {
        await render(hbs`
          {{#step-manager as |w|}}
            {{#each w.steps as |step|}}
              <a {{action w.transition-to step}} data-test-step-trigger={{step}}>
                {{step}}
              </a>
            {{/each}}

            <div data-test-active-step>
              {{#w.step name='foo'}}
                Foo
              {{/w.step}}

              {{#w.step name='bar'}}
                Bar
              {{/w.step}}
            </div>
          {{/step-manager}}
        `);

        assert.dom('[data-test-step-trigger]').exists({ count: 2 });
        assert.dom('[data-test-step-trigger="foo"]').hasText('foo');
        assert.dom('[data-test-step-trigger="bar"]').hasText('bar');

        assert.dom('[data-test-active-step]').hasText('Foo');

        await click('[data-test-step-trigger="bar"]');

        assert.dom('[data-test-active-step]').hasText('Bar');
      });
    });
  });

  module('transitions to named steps', function() {
    test('can transition to another step', async function(assert) {
      await render(hbs`
        {{#step-manager currentStep='first' as |w|}}
          <button {{action w.transition-to 'second'}}>
            Transition to Next
          </button>

          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('[data-test-first]').exists();
      assert.dom('[data-test-second]').doesNotExist();

      await click('button');

      assert.dom('[data-test-first]').doesNotExist();
      assert.dom('[data-test-second]').exists();
    });
  });

  module('exposing whether there is a next step', function() {
    test('linear step manager', async function(assert) {
      await render(hbs`
        {{#step-manager as |w|}}
          <button {{action w.transition-to-next}} disabled={{not w.hasNextStep}}>
            Next!
          </button>

          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('button').doesNotHaveAttribute('disabled');

      await click('button');

      assert.dom('button').hasAttribute('disabled');
    });

    test('circular step manager', async function(assert) {
      await render(hbs`
        {{#step-manager linear=false as |w|}}
          <button {{action w.transition-to-next}} disabled={{not w.hasNextStep}}>
            Next!
          </button>

          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}

          {{#w.step name='second'}}
            <div data-test-second></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('button').doesNotHaveAttribute('disabled');

      await click('button');

      assert.dom('button').doesNotHaveAttribute('disabled');
    });
  });

  module('exposing whether there is a previous step', function() {
    test('linear step manager', async function(assert) {
      await render(hbs`
        {{#step-manager as |w|}}
          <button {{action w.transition-to-previous}} disabled={{not w.hasPreviousStep}}>
            Next!
          </button>

          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('button').hasAttribute('disabled');
    });

    test('circular step manager', async function(assert) {
      await render(hbs`
        {{#step-manager linear=false as |w|}}
          <button {{action w.transition-to-next}} disabled={{not w.hasPreviousStep}}>
            Next!
          </button>

          {{#w.step name='first'}}
            <div data-test-first></div>
          {{/w.step}}
        {{/step-manager}}
      `);

      assert.dom('button').doesNotHaveAttribute('disabled');
    });
  });

  module('transition to anonymous steps', function() {
    module('with the circular state manager', function() {
      test('can transition to the next step', async function(assert) {
        await render(hbs`
          {{#step-manager linear=false as |w|}}
            <button {{action w.transition-to-next}}>
              Next!
            </button>

            {{#w.step name='first'}}
              <div data-test-first></div>
            {{/w.step}}

            {{#w.step name='second'}}
              <div data-test-second></div>
            {{/w.step}}

            {{#w.step name='third'}}
              <div data-test-third></div>
            {{/w.step}}
          {{/step-manager}}
        `);

        assert.dom('[data-test-first]').exists();
        assert.dom('[data-test-second]').doesNotExist();
        assert.dom('[data-test-third]').doesNotExist();

        await click('button');

        assert.dom('[data-test-first]').doesNotExist();
        assert.dom('[data-test-second]').exists();
        assert.dom('[data-test-third]').doesNotExist();

        await click('button');

        assert.dom('[data-test-first]').doesNotExist();
        assert.dom('[data-test-second]').doesNotExist();
        assert.dom('[data-test-third]').exists();

        await click('button');

        assert.dom('[data-test-first]').exists();
        assert.dom('[data-test-second]').doesNotExist();
        assert.dom('[data-test-third]').doesNotExist();
      });

      test('can transition to the previous step', async function(assert) {
        await render(hbs`
          {{#step-manager linear=false as |w|}}
            <button id='previous' {{action w.transition-to-previous}}>
              Previous!
            </button>
            <button id='next' {{action w.transition-to-next}}>
              Next!
            </button>

            {{#w.step name='first'}}
              <div data-test-first></div>
            {{/w.step}}

            {{#w.step name='second'}}
              <div data-test-second></div>
            {{/w.step}}

            {{#w.step name='third'}}
              <div data-test-third></div>
            {{/w.step}}
          {{/step-manager}}
        `);

        assert.dom('[data-test-first]').exists();
        assert.dom('[data-test-second]').doesNotExist();
        assert.dom('[data-test-third]').doesNotExist();

        await click('#next');

        assert.dom('[data-test-first]').doesNotExist();
        assert.dom('[data-test-second]').exists();
        assert.dom('[data-test-third]').doesNotExist();

        await click('#next');

        assert.dom('[data-test-first]').doesNotExist();
        assert.dom('[data-test-second]').doesNotExist();
        assert.dom('[data-test-third]').exists();

        await click('#previous');

        assert.dom('[data-test-first]').doesNotExist();
        assert.dom('[data-test-second]').exists();
        assert.dom('[data-test-third]').doesNotExist();
      });
    });
  });

  module('dynamically creating steps', function(hooks) {
    hooks.beforeEach(function() {
      this.set('data', A([{ name: 'foo' }, { name: 'bar' }]));
    });

    test('allows for defining steps from a data', async function(assert) {
      await render(hbs`
        {{#step-manager as |w|}}
          <div data-test-steps>
            {{#each data as |item|}}
              {{#w.step}}
                <div data-test-step={{item.name}}>
                  {{item.name}}
                </div>
              {{/w.step}}
            {{/each}}
          </div>

          <button {{action w.transition-to-next}}>
            Next
          </button>
        {{/step-manager}}
      `);

      assert.dom('[data-test-step="foo"]').exists();
      assert.dom('[data-test-step="bar"]').doesNotExist();
      assert.dom('[data-test-steps]').hasText('foo');

      await click('button');

      assert.dom('[data-test-step="foo"]').doesNotExist();
      assert.dom('[data-test-step="bar"]').exists();
      assert.dom('[data-test-steps]').hasText('bar');
    });

    test('allows for replacing the array with one that has additional steps', async function(assert) {
      await render(hbs`
        {{#step-manager linear=false as |w|}}
          <div data-test-steps>
            {{#each data as |item|}}
              {{#w.step name=item.name}}
                <div data-test-step={{item.name}}>
                  {{item.name}}
                </div>
              {{/w.step}}
            {{/each}}
          </div>

          <button {{action w.transition-to-next}}>
            Next
          </button>
        {{/step-manager}}
      `);

      assert.dom('[data-test-step="foo"]').exists('Initial step is visible');

      await click('button');

      assert
        .dom('[data-test-step="foo"]')
        .doesNotExist('Initial step is no longer visible');
      assert.dom('[data-test-step="bar"]').exists('Second step is visible');

      this.set('data', A([{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]));

      assert
        .dom('[data-test-step="bar"]')
        .exists(
          'Second step is still visible after replacing the array backing the set of steps'
        );

      await click('button');

      assert.dom('[data-test-step="baz"]').exists('Advanced to the new step');

      await click('button');

      assert.dom('[data-test-step="foo"]').exists('Back to the first step');
    });

    test('allows for pushing new steps into the array creating the steps', async function(assert) {
      await render(hbs`
        {{#step-manager linear=false as |w|}}
          <div data-test-steps>
            {{#each data as |item|}}
              {{#w.step name=item.name}}
                <div data-test-step={{item.name}}>
                  {{item.name}}
                </div>
              {{/w.step}}
            {{/each}}
          </div>

          <button {{action w.transition-to-next}}>
            Next
          </button>
        {{/step-manager}}
      `);

      assert.dom('[data-test-step="foo"]').exists('Initial step is visible');

      await click('button');

      assert
        .dom('[data-test-step="foo"]')
        .doesNotExist('Initial step is no longer visible');
      assert.dom('[data-test-step="bar"]').exists('Second step is visible');

      this.get('data').pushObject({ name: 'baz' });

      assert
        .dom('[data-test-step="bar"]')
        .exists(
          'Second step is still visible after replacing the array backing the set of steps'
        );

      await click('button');

      assert.dom('[data-test-step="baz"]').exists('Advanced to the new step');

      await click('button');

      assert.dom('[data-test-step="foo"]').exists('Back to the first step');
    });
  });

  module('dynamically removing steps', function() {
    test('allows for replacing the array with one that has missing steps', async function(assert) {
      this.set('data', A([{ name: 'foo' }, { name: 'bar' }]));

      await render(hbs`
        {{#step-manager linear=true as |w|}}
          <div data-test-steps>
            {{#each data as |item|}}
              {{#w.step name=item.name}}
                <div data-test-step={{item.name}}>
                  {{item.name}}
                </div>
              {{/w.step}}
            {{/each}}
          </div>
        {{/step-manager}}
      `);

      assert
        .dom('[data-test-step="foo"]')
        .exists('The initial step is rendered');

      this.set('data', A([{ name: 'foo' }]));

      assert
        .dom('[data-test-step="foo"]')
        .exists('The initial step is still visible');
    });

    test('allows for removing a specific step without replacing the whole array', async function(assert) {
      const stepToRemove = { name: 'bar' };
      this.set('data', A([{ name: 'foo' }, stepToRemove]));

      await render(hbs`
        {{#step-manager linear=false as |w|}}
          <div data-test-steps>
            {{#each data as |item|}}
              {{#w.step name=item.name}}
                <div data-test-step={{item.name}}>
                  {{item.name}}
                </div>
              {{/w.step}}
            {{/each}}
          </div>

          <button {{action w.transition-to-next}}>
            Next
          </button>
        {{/step-manager}}
      `);

      assert
        .dom('[data-test-step="foo"]')
        .exists('The initial step is rendered');

      this.get('data').removeObject(stepToRemove);

      assert
        .dom('[data-test-step="foo"]')
        .exists('The initial step is still visible');

      await click('button');

      assert
        .dom('[data-test-step="foo"]')
        .exists('The initial step is still visible');
    });
  });
});