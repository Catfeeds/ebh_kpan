module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    

    var transport = require('grunt-cmd-transport');
    var style = transport.style.init(grunt);
    var text = transport.text.init(grunt);
    var script = transport.script.init(grunt);

    //http://www.jankerli.com/?p=1658
    //http://gruntjs.com/configuring-tasks#files
    grunt.initConfig({
        pkg:grunt.file.readJSON("package.json"),
        meta: {basePath:'<%= pkg.static_path %>'},
        transport:{/*解析*/
            options:{
                paths:['.'],
                alias: '<%= pkg.spm.alias %>',
                parsers:{
                    '.js':[script.jsParser],
                    '.css':[style.css2jsParser],
                    '.html':[text.html2jsParser]
                }
            },
            kod:{
                options:{
                    relative: true,
                    idleading:'app/'//前缀
                },
                files:[{
                    expand: true,
                    cwd:'<%= pkg.static_path %>_dev/',
                    src: ['**/*.js','**/*.html'],
                    filter:'isFile',
                    dest:'<%= pkg.static_path %>.build/'
                }]
            }
        },
        concat:{/*合并*/
            options:{
                 paths:['<%= pkg.static_path %>'],
                 include:'relative'    
            },
            kod:{
                files: [{
                    expand: true,
                    cwd: '<%= pkg.static_path %>.build/',
                    src: ['**/*.js','**/*.html'],
                    dest: '<%= pkg.static_path %>app/',//输出
                    ext: '.js'
                }]
            }
        },
        uglify:{/*压缩*/
            options: {
                banner:'/*! power by kodexplorer ver<%= pkg.version %>(<%= grunt.template.today("yyyy-mm-dd") %>) [build <%= (new Date()).valueOf() %>] */\n',//添加banner
            },
            kod:{
                files: [{
                    expand: true,
                    cwd: '<%= pkg.static_path %>app',
                    src: ['**/*.js','!**/*-debug.js'],
                    dest: '<%= pkg.static_path %>app/',
                    ext: '.js'
                }]
            }
        },
        clean:{/*清除.build文件*/
            options:{
                 force:true   
            },
            spm:['<%= pkg.static_path %>.build',
                '<%= pkg.static_path %>app/common',
                '<%= pkg.static_path %>app/share_common',
                '<%= pkg.static_path %>app/tpl',
                '<%= pkg.static_path %>app/edit/tpl',
                '<%= pkg.static_path %>app/explorer/tpl',
                '<%= pkg.static_path %>app/setting/page',
                '<%= pkg.static_path %>app/setting/system',
                '<%= pkg.static_path %>app/**/*.js',
                '!<%= pkg.static_path %>app/**/main.js'
                ]
        }
    });
    grunt.registerTask('build', [
        'transport:kod',
        'concat:kod',
        'uglify:kod',
        'clean'
    ]);
};
