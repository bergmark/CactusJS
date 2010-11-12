require 'test/unit'

load 'scripts/file_dependency/file_dependency.rb'

class TC_FileDependency < Test::Unit::TestCase
  def setup
    `mkdir -p trunk/Foo/Bar`
    `touch trunk/Base.js`
    `touch trunk/Foo/Qux.js`
    `touch trunk/Foo/Bar/Baz.js`
    `touch trunk/Foo/Bar/Bax.js`
    `touch trunk/Foo/Bar/Bam.js`
    `mkdir -p trunk/UnitTest/Foo`
    `touch trunk/UnitTest/Foo/UT-Qux.js`

    `echo "Cactus.Foo.Bar.Baz; Cactus.Foo.Bar.Bax; Cactus.Foo.Bar.Bam;" >> trunk/Foo/Bar/Bam.js`

    @files = `find trunk -name "*.js"`.split
    FileDependency.clear
  end

  def teardown
    `rm -r trunk/Foo`
    `rm -r trunk/UnitTest/Foo`
  end

  def test_base_file_found
    assert @files.any? { |f| f =~ /Base.js$/ }
  end

  def test_path_to_js_path
    def f(path)
      FileDependency.path_to_js_path(path)
    end

    assert_equal 'Foo', f('trunk/Foo')
    assert_equal 'Base', f('trunk/Base.js')
    assert_equal 'Foo.Qux', f('trunk/Foo/Qux.js')

    assert_equal 'UnitTest.Foo.Qux', f('trunk/UnitTest/Foo/UT-Qux.js')
  end

  def test_js_path_to_path
    def f(js_path)
      FileDependency.js_path_to_path(js_path)
    end

    assert_equal 'trunk/Foo', f('Foo')
    assert_equal 'trunk/Foo/Qux.js', f('Foo.Qux')
    assert_equal 'trunk/UnitTest/Foo/UT-Qux.js', f('UnitTest.Foo.Qux')
  end

  def test_self_find_all
    assert_equal 0, FileDependency.find_all.size
  end

  def test_dependencies
    bam = FileDependency.find('Foo.Bar.Bam')
    baz = FileDependency.find('Foo.Bar.Baz')
    bax = FileDependency.find('Foo.Bar.Bax')
    assert_equal 2, bam.dependencies.size
    assert bam.dependencies.include?(baz)
    assert bam.dependencies.include?(bax)

    baz.taken = true

    assert_equal 1, bam.dependencies.size

  end
end

require 'test/unit/ui/console/testrunner'
Test::Unit::UI::Console::TestRunner.run(TC_FileDependency)

