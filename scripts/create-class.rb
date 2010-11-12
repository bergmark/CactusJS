#
# Copyright (c) 2007-2010, Adam Bergmark
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#     * Neither the name of Cactus JS nor the
#       names of its contributors may be used to endorse or promote products
#       derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY Adam Bergmark ``AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL Adam Bergmark BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

#
# @file
# Creates a class file and its associated unit test file. Intermediate
# directories are created if necessary.
#

if ARGV.size.zero?
  puts "Syntax is create_class.rb <Package.Path.Module>"
  exit
end

require "FileUtils"

path = ARGV.first

path = path.gsub ".", "/"

path =~ %r{\A(.+)/([^/]+?)\z}


cactus_path = FileUtils.pwd + "/trunk"

relative_package_path = $1
package_path = cactus_path + "/" + relative_package_path

relative_ut_path = "UnitTest/" + relative_package_path
ut_path = cactus_path + "/" + relative_ut_path

class_name = $2
class_filename = class_name + ".js"

relative_class_path = relative_package_path + "/" + class_filename
class_path = cactus_path + "/" + relative_class_path

relative_ut_class_path = "UnitTest/" + relative_package_path + "/UT-" + class_filename
ut_class_path = cactus_path + "/" + relative_ut_class_path

`mkdir -p #{package_path}`
puts "Created directory #{relative_package_path}"

`touch #{class_path}`
puts "Created file #{relative_class_path}"

`mkdir -p #{ut_path}`
puts "Created directory #{relative_ut_path}"

`touch #{ut_class_path}`
puts "Created file #{relative_ut_class_path}"

relative_license_path = "license.txt"
license_path = cactus_path + "/" + relative_license_path

js_package_path = relative_class_path.gsub('/', '.').sub('.js', '')

`cat #{license_path} >> #{class_path}`
`echo "/**
 * @file
 *
 */
Cactus.#{js_package_path} = (function () {
    var log = Cactus.Dev.log;

    function #{class_name}() {

    } #{class_name}.prototype = {

    };

    return #{class_name};
})();
" >> #{class_path}`

`cat #{license_path} >> #{ut_class_path}`
`echo "Cactus.UnitTest.#{js_package_path} = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var #{class_name} = Cactus.#{js_package_path};

    var tc = new TestCase(\\"#{js_package_path}\\");

    tc.addTest(function () {
        this.assert(false, \\"Tests not written.\\");
    });

    return [tc];
};
" >> #{ut_class_path}`
