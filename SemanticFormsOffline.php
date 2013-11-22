<?php

$wgExtensionCredits[defined('SEMANTIC_EXTENSION_TYPE') ? 'semantic' : 'specialpage'][] = array(
	'path' => __FILE__,
	'name' => 'Semantic Forms Offline',
	'author' => '[http://samwilson.id.au/ Sam Wilson]',
	'url' => 'https://www.mediawiki.org/wiki/Extension:SemanticFormsOffline',
	'descriptionmsg' => 'semanticformsoffline_desc',
	'version' => '0.0.1',
);

$wgExtensionMessagesFiles['SemanticFormsOffline'] = __DIR__ . '/SemanticFormsOffline.i18n.php';
$wgExtensionMessagesFiles['SemanticFormsOfflineAlias'] = __DIR__ . '/SemanticFormsOffline.alias.php';

// Special pages
$wgAutoloadClasses['SpecialSemanticFormsOffline'] = __DIR__ . '/Special.php';
$wgAutoloadClasses['SpecialSemanticFormsOfflineManifest'] = __DIR__ . '/SpecialManifest.php';
$wgAutoloadClasses['SemanticFormsOffline_Utils'] = __DIR__ . '/Utils.php';
$wgSpecialPages['OfflineForms'] = 'SpecialSemanticFormsOffline';
$wgSpecialPages['OfflineFormsManifest'] = 'SpecialSemanticFormsOfflineManifest';
$wgSpecialPageGroups['SemanticFormsOffline'] = 'sf_group';

// Manifest attribute
$wgHooks['OutputPageHtmlAttributes'][] = 'SemanticFormsOffline_HtmlAttrs';
function SemanticFormsOffline_HtmlAttrs($outputPage, $skin, &$htmlAttrs) {
	$htmlAttrs['manifest'] = Title::newFromText('Special:OfflineFormsManifest')->getLocalURL();
	return true;
}

// Styles and scripts
$wgResourceModules["ext.SemanticFormsOffline"] = array(
	'scripts' => 'scripts.js',
	'styles' => 'styles.css',
	'remoteBasePath' => "$wgScriptPath/extensions/SemanticFormsOffline",
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'SemanticFormsOffline',
);

/**
 * Add scripts to Semantic Forms that are not editing an existing page.
 *
 * @global OutputPage $wgOut
 * @param Title $targetTitle Null if there's no target.
 * @param string $pre_form_html HTML to insert after the opening form tag.
 * @return boolean True always.
 */
function SemanticFormsOffline_sfHTMLBeforeForm($targetTitle, &$pre_form_html) {
	global $wgOut;
	$hasTitle = $targetTitle && $targetTitle->exists();
	if (!isset($_POST['wpSave']) && !$hasTitle) {
		$pre_form_html .= '<fieldset class="SemanticFormsOffline">'
				. '<legend>Offline Forms</legend>'
				. '<p>'
				. '  <span class="message">You are online.</span>'
				. '  <span class="counter">0</span> items stored.'
				. '  <a class="button mw-ui-button mw-ui-primary">Go offline.</a>'
				. '</p>'
				. '</fieldset>';
		$wgOut->addModules('ext.SemanticFormsOffline');
	}
	return true;
}
$wgHooks['sfHTMLBeforeForm'][] = 'SemanticFormsOffline_sfHTMLBeforeForm';
