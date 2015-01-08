<?php
/*
Plugin Name: HTML5音乐播放器
Plugin URI: http://sell.moe
Description: HTML5音乐播放器
Version: 1.0
Author: Kagami
Author URI: http://sell.moe
*/

/**
 * 启用插件动作
 */
register_activation_hook(__FILE__,'cat_music_active');
function cat_music_active() {
	global $wpdb;
	$table_name = $wpdb->prefix."music";
	if($wpdb->get_var("show tables like '$table_name'") != $table_name){
		$sql = 'CREATE TABLE IF NOT EXISTS `'.$table_name.'` (
			`id` int(10) unsigned NOT NULL AUTO_INCREMENT KEY,
			`title` varchar(255) NOT NULL,
			`artist` varchar(64) DEFAULT NULL,
			`album` varchar(128) DEFAULT NULL,
			`year` varchar(16) DEFAULT NULL,
			`cover` varchar(255) NOT NULL,
			`path` varchar(255) NOT NULL,
			`singer` varchar(64) NOT NULL,
			`lrc` varchar(255) DEFAULT NULL,
			`length` varchar(16) NOT NULL
			) ENGINE=MyISAM DEFAULT CHARSET=utf8;';
		require_once(ABSPATH . 'wp-admin/upgrade-functions.php');
		dbDelta($sql);
	}
}
/**
 * 禁用插件动作
 */
register_activation_hook(__FILE__,'cat_music_deactive');
function cat_music_deactive() {

}

/**
 * 添加前台钩子
 */
add_action( 'wp_footer', 'add_stage', 100 );
function add_stage() {
	global $wpdb;
?>
		<script type="text/javascript" src="<?php echo plugins_url(); ?>/cat_music/static/jquery.min.js"></script>
		<script type="text/javascript">
			var jQuery = jQuery.noConflict();
			var ajaxurl = '<?php  echo admin_url()."admin-ajax.php"; ?>';
			var staticFolder = '<?php echo plugins_url(); ?>/cat_music/static/';
			var cookieDomain = '<?php $url = explode("//", site_url()); echo $url[1]; ?>';
		</script>
		<script type="text/javascript" src="<?php echo plugins_url()."/cat_music/static/sweet-alert.min.js" ?>"></script>
		<link rel="stylesheet" type="text/css" href="<?php echo plugins_url()."/cat_music/static/player.min.css" ?>">
		<link rel="stylesheet" type="text/css" href="<?php echo plugins_url()."/cat_music/static/sweetalert.css" ?>">
		<div id="stage">
			<div class="toggle-player"></div>
		  	<div class="main-player">
		  		<div class="close-window"></div>
			  	<div class="song-list">
			  		<div class="song-box">
			  			<div class="sort-card">
			  				<div class="default-list selected"><span>List</span></div>
			  				<div class="fav-list"><span>Love</span></div>
			  			</div>
			  			<div class="item-lists">
			  				
			  			</div>
			  		</div>
			  		<div class="close-songlist">
			  			<div class="close-arrow"></div>
			  		</div>
			  	</div>
		  		<div class="main-area"> 
		  			<div class="interface">
		  			<?php
		  				$firstSongObj = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` ORDER BY `id` ASC LIMIT 1");
		  				$firstSongArr = obj2arr($firstSongObj);
			  			echo '
							<div class="song-cover" id="pause">
								<div class="cover-shadow"></div>
								<img src="'.$firstSongArr['cover'].'" />
								<audio id="music" data-id="1" src="'.$firstSongArr['path'].'"></audio>
								<input id="pauseTime" type="hidden" />
								<input id="lrc" type="hidden" />
								<i></i>
							</div>
							<div class="song-note">
								<img src="'.plugins_url().'/cat_music/static/note.png">
							</div>
							<div class="song-info">
								<span class="song-name">'.$firstSongArr['title'].'</span>
							</div>
						';
					?>
						<div id="lrcBox"></div>
						<div class="control-panel">
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/like.png" id="song-love" /></span>
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/dustbin.png" id="song-dust" /></span>
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/play.png" id="song-play" /></span>
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/prev.png" id="song-prev" /></span>
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/next.png" id="song-next" /></span>
							<span><img src="<?php echo plugins_url(); ?>/cat_music/static/loop.png" id="song-loop" /></span>
							<span style="margin: 0 0 0 17px;"><img src="<?php echo plugins_url(); ?>/cat_music/static/volume.png" id="song-volume" /></span>
							<span class="volume">
								<span class="volume-now"></span>
							</span>
						</div>
					</div>
					<div class="songTime">00:00</div>
		  		</div>
		  	</div>
		  	<div class="progress">
		  		<div class="progress-now"></div>
		  	</div>
		</div>
		<script type="text/javascript" src="<?php echo plugins_url(); ?>/cat_music/static/player.min.js"></script>
		<div id="overlay" style="opacity: 1; cursor: pointer; display: none;"></div>
		<div class="bg-ball" style="display: none;"></div>
		<div class="close-shadow" style="display: none;"></div>
<?php
}

/**
 * 添加后台菜单
 */
add_action('admin_menu','add_settings_menu');
function add_settings_menu() {
	add_menu_page( '上传音乐', '上传音乐', 'manage_options', 'catmusic', 'cat_music_options_page', plugins_url().'/cat_music/static/icon.png', '99' );
	add_submenu_page( 'catmusic', '已上传歌曲修改', '已有歌曲', 'manage_options', 'music_upload', 'uploaded_music' );
}

/**
 * 输出模板
 */
function cat_music_options_page() { 
	global $wpdb;
?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugins_url(); ?>/cat_music/static/style.css" />
    	<div class="wrap">
	       	<?php
	       		if ($_GET['edit']) {
	       			echo "<h2>编辑音乐</h2>";
	       			add_song("1");
	       			$data = intval($_GET['dataid']);
	       			$singleSongInfo = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` WHERE `id`='".$data."'");
				$singleSongInfoArr = obj2arr($singleSongInfo);
	       		}else{
	       			echo "<h2>上传音乐</h2>";
	       			add_song();
	       		}
	       	echo '
	       		<div class="fail">有必填项木有填哦</div>
			<form action="" method="POST" enctype="multipart/form-data">
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row">
								<label for="song">音乐文件(';
									if($_GET["edit"]) {
										echo "选填";
									}else{
										echo "必填";
									}
									echo ')</label>
							</th>
							<td>
								<input type="file" name="song" id="song">	        		
								<br>
								请选择MP3或者ogg文件
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="lrc">歌词文件(选填)</label>
							</th>
							<td>
								<input type="file" name="lrc" id="lrc">	        		
								<br>
								请选择lrc文件
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="cover">封面图片(';
									if($_GET["edit"]) {
										echo "选填";
									}else{
										echo "必填";
									}
									echo ')</label>
							</th>
							<td>
								<input type="file" name="cover" id="cover">	        		
								<br>
								请选择jpg|png|gif格式的图片文件
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songName">歌曲名字(';
									if($_GET["edit"]) {
										echo "选填";
									}else{
										echo "必填";
									}
									echo ')</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['title'].'" name="songName" id="songName">	        		
								<br>	        		
								请填写歌曲名字
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songArtist">作词作曲(选填)</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['artist'].'" name="songArtist" id="songArtist">	        		
								<br>	        		
								请填写作词作曲人
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songAlbum">专辑名称(选填)</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['album'].'" name="songAlbum" id="songAlbum">	        		
								<br>	        		
								请填写专辑名称
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songYear">发行年月(选填)</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['year'].'" name="songYear" id="songYear">	        		
								<br>	        		
								请填写发行年月
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songSinger">歌手姓名(';
									if($_GET["edit"]) {
										echo "选填";
									}else{
										echo "必填";
									}
									echo ')</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['singer'].'" name="songSinger" id="songSinger">	        		
								<br>	        		
								请填写歌手姓名
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="songLength">歌曲长度(';
									if($_GET["edit"]) {
										echo "选填";
									}else{
										echo "必填";
									}
									echo ')</label>
							</th>
							<td>
								<input type="text" class="regular-text" value="'.$singleSongInfoArr['length'].'" name="songLength" id="songLength">	        		
								<br>	        		
								请填写歌曲长度，例子：03:00
							</td>
						</tr>
					</tbody>
				</table>
				<p class="submit">
					<input id="submit" class="button button-primary" type="submit" value="保存更改" name="submit">
				</p>
			</form>
		';
		?>
    	</div>
<?php
}

/**
 * 显示已添加音乐
 */
function uploaded_music() {
	global $wpdb;
	$allSongObj = $wpdb->get_results("SELECT * FROM `".$wpdb->prefix."music` ORDER BY `id` ASC");
	$allSongArr = obj2arr($allSongObj);
	$songNum = count($allSongArr);
?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugins_url(); ?>/cat_music/static/style.css" />
	<link type="text/css" rel="stylesheet" href="<?php echo plugins_url(); ?>/cat_music/static/jPages.css">
	<link rel="stylesheet" type="text/css" href="<?php echo plugins_url(); ?>/cat_music/static/miniplayer.css" />
	<script type="text/javascript" src="<?php echo plugins_url(); ?>/cat_music/static/jquery.min.js"></script>
	<script type="text/javascript" src="<?php echo plugins_url(); ?>/cat_music/static/jquery.jplayer.min.js"></script>
	<script type="text/javascript" src="<?php echo plugins_url(); ?>/cat_music/static/jquery.mb.miniPlayer.min.js"></script>
	<script src="<?php echo plugins_url(); ?>/cat_music/static/jPages.min.js" type="text/javascript"></script>
	<script type="text/javascript">
	$(function(){
		$(".audio").mb_miniPlayer({
			width:10,
			inLine:false,
			id3:true,
			addShadow:false,
			pauseOnWindowBlur: false,
			downloadPage:null
		});
		$(".multipage").jPages({
			containerID : "itemContainer",
			animation : 'fast',
			first : "首页",
			previous : "上一页",
			next : "下一页",
			last : "尾页",
			perPage : 10
		});
	});
	</script>
<?php
	if (!$_GET['edit']) {
	$song = '
	<table class="table table-hover">
			<thead>
				<tr>
					<th>编号</th>
					<th>歌曲名</th>
					<th>艺术家</th>
					<th>专辑名称</th>
					<th>发行年月</th>
					<th>上传图片</th>
					<th>上传歌曲</th>
					<th>歌手姓名</th>
					<th>上传歌词</th>
					<th>歌曲长度</th>
					<th>编辑</th>
				</tr>
			</thead>
			<tbody id="itemContainer">
	';
	for ($i=0; $i < $songNum; $i++) { 
		$song.='
				<tr>
					<td width="30">'.$allSongArr[$i]["id"].'</td>
					<td width="280">'.$allSongArr[$i]["title"].'</td>
					<td width="150">'.$allSongArr[$i]["artist"].'</td>
					<td width="150">'.$allSongArr[$i]["album"].'</td>
					<td width="70">'.$allSongArr[$i]["year"].'</td>
					<td width="70"><a href="'.$allSongArr[$i]["cover"].'" target="_blank">点击查看</a></td>
					<td width="230">
						<a class="audio {skin:"gray", autoPlay:false, inLine:true, showVolumeLevel:false, showRew:false, showTime:false, addShadow:false}" href="'.$allSongArr[$i]["path"].'">'.$allSongArr[$i]["title"].'</a>
					</td>
					<td>'.$allSongArr[$i]["singer"].'</td>
					<td><a href="'.$allSongArr[$i]["lrc"].'" target="_blank">下载</a></td>
					<td>'.$allSongArr[$i]["length"].'</td>
					<td><a href="admin.php?page=music_upload&edit=1&dataid='.$allSongArr[$i]["id"].'" data-id="'.$allSongArr[$i]["id"].'" class="edit">修改</a></td>
				</tr>
		';
	}
	$song.='
			</tbody>
		</table>
	';
	echo $song;
	echo '<div id="page"><div class="multipage"></div></div>';
	}else{
		cat_music_options_page();
	}
}

/**
 * 添加或更新数据
 */
function add_song($isEdit = "0") {
	global $wpdb;
	$maxObj = $wpdb->get_row("SELECT * FROM ".$wpdb->prefix."music ORDER BY `id` DESC LIMIT 1");
	$max = obj2arr($maxObj);
	if ($isEdit == "0") {
		if ($_POST['songName'] && $_POST['songSinger'] && $_POST['songLength'] && $_FILES['song']['tmp_name'] && $_FILES['cover']['tmp_name']) {
			$max = $max['id'] + 1;
	    		$songName = addslashes($_POST['songName']);
	    		$songArtist = $_POST['songArtist']?addslashes($_POST['songArtist']):"";
	    		$songAlbum = $_POST['songAlbum']?addslashes($_POST['songAlbum']):"";
	    		$songYear = $_POST['songYear']?addslashes($_POST['songYear']):"";
	    		$songSinger = addslashes($_POST['songSinger']);
	    		$songLength = addslashes($_POST['songLength']);
	    		$song = $_FILES['song']['tmp_name'];
	    		$cover = $_FILES['cover']['tmp_name'];
	    		$songPath = upload($_FILES['song']['name'], $song, array("mp3"), $max);
	    		$coverPath = upload($_FILES['cover']['name'], $cover, array("jpg", "png", "gif"), $max);
	    		if ($_FILES['lrc']['tmp_name']) {
	    			$lrc = $_FILES['lrc']['tmp_name'];
	    			$lrcPath = upload($_FILES['lrc']['name'], $lrc, array("lrc"), $max);
	    		}else{
	    			$lrcPath = "";
	    		}
	    		$wpdb->insert($wpdb->prefix."music", array("title"=>$songName, "artist"=>$songArtist, "album"=>$songAlbum, "year"=>$songYear, "cover"=>$coverPath, "path"=>$songPath, "singer"=>$songSinger, "lrc"=>$lrcPath, "length"=>$songLength));
	    		echo "<div class='success'>上传成功</div>";
	    	}
	}elseif ($isEdit == "1") {
		if ($_POST['songName'] && $_POST['songSinger'] && $_POST['songLength']) {
			$dataId = intval($_GET['dataid']);
			$songName = addslashes($_POST['songName']);
			$songArtist = $_POST['songArtist']?addslashes($_POST['songArtist']):"";
			$songAlbum = $_POST['songAlbum']?addslashes($_POST['songAlbum']):"";
			$songYear = $_POST['songYear']?addslashes($_POST['songYear']):"";
			$songSinger = addslashes($_POST['songSinger']);
			$songLength = addslashes($_POST['songLength']);
			if ($_FILES['song']['tmp_name']) {
				$song = $_FILES['song']['tmp_name'];
				$songPath = upload($_FILES['song']['name'], $song, array("mp3"), $dataId);
			}else{
				$songPath = "";
			}
			if ($_FILES['cover']['tmp_name']) {
				$cover = $_FILES['cover']['tmp_name'];
				$coverPath = upload($_FILES['cover']['name'], $cover, array("jpg", "png", "gif"), $dataId);
			}else{
				$coverPath = "";
			}
			if ($_FILES['lrc']['tmp_name']) {
				$lrc = $_FILES['lrc']['tmp_name'];
				$lrcPath = upload($_FILES['lrc']['name'], $lrc, array("lrc"), $dataId);
			}else{
				$lrcPath = "";
			}
			$query = array("title"=>$songName, "artist"=>$songArtist, "album"=>$songAlbum, "year"=>$songYear, "singer"=>$songSinger, "length"=>$songLength);
			if ($songPath) {
				$query['path'] = $songPath;
			}
			if ($lrcPath) {
				$query['lrc'] = $lrcPath;
			}
			if ($coverPath) {
				$query['cover'] = $coverPath;
			}
			$wpdb->update($wpdb->prefix."music", $query, array("id"=>$dataId));
			echo "<div class='success'>更新成功</div>";
	    	}
	}
}

/**
 * 上传文件方法
 * @param  string $fileName       上传的文件名
 * @param  object $file           上传的文件
 * @param  array $allowExtension 允许上传的后缀
 * @param  string $n              文件编号
 * @return string                 文件储存路径
 */
function upload($fileName, $file, $allowExtension, $n) {
	global $wpdb;
	$fileName = addslashes($fileName);
	$fileExtension = explode(".", $fileName);
	if (in_array($fileExtension[1], $allowExtension)) {
		$path_array  = wp_upload_dir();
		$path = str_replace('\\', '/', $path_array['path']);
		$targetFolder = $path."/".$n.".".$fileExtension[1];
		move_uploaded_file($file, $targetFolder);
		return str_replace('\\', '/', $path_array['url'])."/".$n.".".$fileExtension[1];
	}else{
		die();
	}
}

/**
 * 对象 转 数组
 * @param  object $obj 对象
 * @return array      数组
 */
function obj2arr($obj) {
    	if(is_object($obj)) {
        		$obj = (array)$obj;
        		$obj = obj2arr($obj);
    	} elseif(is_array($obj)) {
        		foreach($obj as $key => $value) {
            		$obj[$key] = obj2arr($value);
        		}
    	}
    	return $obj;
}

/**
 * 获取上一首歌曲
 */
add_action( 'wp_ajax_get_prevsong', 'wp_ajax_get_prevsong' );
add_action( 'wp_ajax_nopriv_get_prevsong', 'wp_ajax_get_prevsong' );
function wp_ajax_get_prevsong() {
	global $wpdb;
	$maxIdObj = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` ORDER BY `id` DESC LIMIT 1");
	$maxIdArr = obj2arr($maxIdObj);
	$maxId = $maxIdArr['id'];
	if (intval($_POST['songId']) == 1) {
		$prevSongId = $maxId;
	}else{
		$prevSongId = intval($_POST['songId']) - 1;
	}
	if ($_COOKIE['kagami_unliked']) {
		$unlikeArr = explode(",", $_COOKIE['kagami_unliked']);
		while (in_array($prevSongId, $unlikeArr)) {
			$prevSongId -=1;
		}
	}
	$songInfo = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` WHERE `id`='".$prevSongId."'");
	$arr = obj2arr($songInfo);
	$arr['lrc'] = file_get_contents($arr['lrc']);
	$return = json_encode($arr);
	echo $return;
}

/**
 * 获取下一首歌曲
 */
add_action( 'wp_ajax_get_nextsong', 'wp_ajax_get_nextsong' );
add_action( 'wp_ajax_nopriv_get_nextsong', 'wp_ajax_get_nextsong' );
function wp_ajax_get_nextsong() {
	global $wpdb;
	$maxIdObj = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` ORDER BY `id` DESC LIMIT 1");
	$maxIdArr = obj2arr($maxIdObj);
	$maxId = $maxIdArr['id'];
	if ($maxId == intval($_POST['songId'])) {
		$nextSongId = "1";
	}else{
		$nextSongId = intval($_POST['songId']) + 1;
	}
	if ($_COOKIE['kagami_unliked']) {
		$unlikeArr = explode(",", $_COOKIE['kagami_unliked']);
		while (in_array($nextSongId, $unlikeArr)) {
			$nextSongId +=1;
		}
	}
	$songInfo = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` WHERE `id`='".$nextSongId."'");
	$arr = obj2arr($songInfo);
	$lrcContent = file_get_contents($arr['lrc']);
	$arr['lrc'] = $lrcContent;
	$return = json_encode($arr);
	echo $return;
}

/**
 * 获取歌曲列表
 */
add_action( 'wp_ajax_get_songlist', 'wp_ajax_get_songlist' );
add_action( 'wp_ajax_nopriv_get_songlist', 'wp_ajax_get_songlist' );
function wp_ajax_get_songlist() {
	global $wpdb;
	$allSongObj = $wpdb->get_results("SELECT * FROM `".$wpdb->prefix."music` ORDER BY `id` ASC");
	$allSongArr = obj2arr($allSongObj);
	$return = json_encode($allSongArr);
	echo $return;
}

/**
 * 获取喜欢列表
 */
add_action( 'wp_ajax_get_favlist', 'wp_ajax_get_favlist' );
add_action( 'wp_ajax_nopriv_get_favlist', 'wp_ajax_get_favlist' );
function wp_ajax_get_favlist() {
	global $wpdb;
	$favSongString = addslashes($_POST['favlist']);
	$favSongArr = explode(",", $favSongString);
	$favSongNum = count($favSongArr);
	$fav = "";
	for ($i=0; $i < $favSongNum; $i++) { 
		$fav .= "'".intval($favSongArr[$i])."',";
	}
	$fav = rtrim($fav, ",");
	$favSongObj = $wpdb->get_results("SELECT * FROM `".$wpdb->prefix."music` WHERE `id` in (".$fav.") ORDER BY `id` ASC");
	$favSongArr = obj2arr($favSongObj);
	$return = json_encode($favSongArr);
	echo $return;
}

/**
 * 获取单首歌曲
 */
add_action( 'wp_ajax_get_single', 'wp_ajax_get_single' );
add_action( 'wp_ajax_nopriv_get_single', 'wp_ajax_get_single' );
function wp_ajax_get_single() {
	global $wpdb;
	$singleSong = intval($_POST['singleId']);
	$singleSongObj = $wpdb->get_row("SELECT * FROM `".$wpdb->prefix."music` WHERE `id`='".$singleSong."'");
	$singleSongArr = obj2arr($singleSongObj);
	$lrcContent = file_get_contents($singleSongArr['lrc']);
	$singleSongArr['lrc'] = $lrcContent;
	$return = json_encode($singleSongArr);
	echo $return;
}

/**
 * 获取歌曲长度
 */
add_action( 'wp_ajax_get_songlength', 'wp_ajax_get_songlength' );
add_action( 'wp_ajax_nopriv_get_songlength', 'wp_ajax_get_songlength' );
function wp_ajax_get_songlength() {
	global $wpdb;
	$songLengthObj = $wpdb->get_results("SELECT * FROM `".$wpdb->prefix."music`");
	$songLengthArr = obj2arr($songLengthObj);
	$return = count($songLengthArr);
	echo $return;
}
?>